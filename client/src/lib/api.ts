import {
  ActiveSession,
  AuthUser,
  CreateRoomState,
  DirectChatSummary,
  DirectMessagesPayload,
  DirectMessage,
  FriendRequest,
  FriendState,
  RoomBan,
  RoomAttachment,
  RoomInvitation,
  Room,
  RoomMessagePage,
  RoomMessage,
} from '../types/api';

const API_BASE = '/api';

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T);

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String(data.message)
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  return readJson<T>(response);
}

export const api = {
  getRoomAttachmentDownloadUrl: (roomId: string, attachmentId: string) =>
    `${API_BASE}/rooms/${roomId}/attachments/${attachmentId}/download`,
  me: async () => apiRequest<{ user: AuthUser }>('/auth/me'),
  heartbeat: async (payload: { isActive: boolean; tabId: string }) =>
    apiRequest<{ status: 'ok'; recordedAt: string }>('/presence/heartbeat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSessions: async () => apiRequest<{ sessions: ActiveSession[] }>('/auth/sessions'),
  revokeSession: async (sessionId: string) =>
    apiRequest<{ success: true }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  changePassword: async (payload: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ success: true }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPassword: async (payload: { email: string; newPassword: string }) =>
    apiRequest<{ success: true }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAccount: async (payload: { currentPassword: string }) =>
    apiRequest<{ success: true }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    }),
  login: async (payload: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: async (payload: {
    email: string;
    username: string;
    password: string;
  }) =>
    apiRequest<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: async () =>
    apiRequest<{ success: true }>('/auth/logout', {
      method: 'POST',
    }),
  getRooms: async () => apiRequest<{ rooms: Room[] }>('/rooms'),
  getRoom: async (roomId: string) => apiRequest<{ room: Room }>(`/rooms/${roomId}`),
  createRoom: async (payload: CreateRoomState) =>
    apiRequest<{ room: Room }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRoomMessages: async (roomId: string, options?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.before) {
      params.set('before', options.before);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    const query = params.toString();
    return apiRequest<RoomMessagePage>(
      `/rooms/${roomId}/messages${query ? `?${query}` : ''}`,
    );
  },
  sendRoomMessage: async (roomId: string, payload: { text: string }) =>
    apiRequest<{ message: RoomMessage }>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRoomMessage: async (roomId: string, messageId: string) =>
    apiRequest<{ success: true; roomId: string; messageId: string }>(
      `/rooms/${roomId}/messages/${messageId}`,
      {
        method: 'DELETE',
      },
    ),
  getRoomAttachments: async (roomId: string) =>
    apiRequest<{ attachments: RoomAttachment[] }>(`/rooms/${roomId}/attachments`),
  uploadRoomAttachment: async (
    roomId: string,
    payload: { file: File; comment?: string },
  ) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.comment?.trim()) {
      formData.append('comment', payload.comment.trim());
    }

    const response = await fetch(`${API_BASE}/rooms/${roomId}/attachments`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return readJson<{ attachment: RoomAttachment }>(response);
  },
  joinRoom: async (roomId: string) =>
    apiRequest<{ room: Room }>(`/rooms/${roomId}/join`, {
      method: 'POST',
    }),
  leaveRoom: async (roomId: string) =>
    apiRequest<{ success: true; roomId: string }>(`/rooms/${roomId}/leave`, {
      method: 'POST',
    }),
  deleteRoom: async (roomId: string) =>
    apiRequest<{ success: true; roomId: string }>(`/rooms/${roomId}`, {
      method: 'DELETE',
    }),
  promoteAdmin: async (roomId: string, targetUserId: string) =>
    apiRequest<{ success: true; roomId: string; userId: string; role: 'ADMIN' }>(
      `/rooms/${roomId}/admins/${targetUserId}/promote`,
      {
        method: 'POST',
      },
    ),
  demoteAdmin: async (roomId: string, targetUserId: string) =>
    apiRequest<{ success: true; roomId: string; userId: string; role: 'MEMBER' }>(
      `/rooms/${roomId}/admins/${targetUserId}/demote`,
      {
        method: 'POST',
      },
    ),
  removeMember: async (roomId: string, targetUserId: string) =>
    apiRequest<{ success: true; roomId: string; userId: string; banned: true }>(
      `/rooms/${roomId}/members/${targetUserId}/remove`,
      {
        method: 'POST',
      },
    ),
  getRoomBans: async (roomId: string) =>
    apiRequest<{ bans: RoomBan[] }>(`/rooms/${roomId}/bans`),
  banRoomUser: async (roomId: string, payload: { userId: string; reason?: string }) =>
    apiRequest<{ success: true; roomId: string; userId: string; banned: true }>(
      `/rooms/${roomId}/bans`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  unbanRoomUser: async (roomId: string, targetUserId: string) =>
    apiRequest<{ success: true; roomId: string; userId: string; banned: false }>(
      `/rooms/${roomId}/bans/${targetUserId}`,
      {
        method: 'DELETE',
      },
    ),
  inviteToRoom: async (roomId: string, payload: { username: string; message?: string }) =>
    apiRequest<{ invitation: RoomInvitation }>(`/rooms/${roomId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyRoomInvitations: async () =>
    apiRequest<{ invitations: RoomInvitation[] }>('/rooms/invitations/me'),
  acceptRoomInvitation: async (roomId: string) =>
    apiRequest<{ room: Room }>(`/rooms/${roomId}/invitations/accept`, {
      method: 'POST',
    }),
  declineRoomInvitation: async (roomId: string) =>
    apiRequest<{ success: true; roomId: string }>(`/rooms/${roomId}/invitations/decline`, {
      method: 'POST',
    }),
  getFriends: async () => apiRequest<FriendState>('/friends'),
  sendFriendRequest: async (payload: { username: string; message?: string }) =>
    apiRequest<{ request: FriendRequest }>('/friends/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  acceptFriendRequest: async (requestId: string) =>
    apiRequest<{ success: true; friend: { id: string; username: string } }>(
      `/friends/requests/${requestId}/accept`,
      {
        method: 'POST',
      },
    ),
  declineFriendRequest: async (requestId: string) =>
    apiRequest<{ success: true }>(`/friends/requests/${requestId}/decline`, {
      method: 'POST',
    }),
  blockUser: async (targetUserId: string) =>
    apiRequest<{ success: true }>(`/friends/blocks/${targetUserId}`, {
      method: 'POST',
    }),
  unblockUser: async (targetUserId: string) =>
    apiRequest<{ success: true }>(`/friends/blocks/${targetUserId}`, {
      method: 'DELETE',
    }),
  getDirectChats: async () => apiRequest<{ chats: DirectChatSummary[] }>('/direct-chats'),
  getDirectMessages: async (friendId: string) =>
    apiRequest<DirectMessagesPayload>(`/direct-chats/${friendId}/messages`),
  sendDirectMessage: async (friendId: string, payload: { text: string }) =>
    apiRequest<{ message: DirectMessage }>(`/direct-chats/${friendId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
