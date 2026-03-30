export type AuthUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
};

export type ActiveSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
};

export type RoomMember = {
  id: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  presence: 'online' | 'afk' | 'offline';
};

export type Room = {
  id: string;
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  owner: {
    id: string;
    username: string;
  };
  membersCount: number;
  isMember: boolean;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  unreadCount: number;
  members: RoomMember[];
};

export type RoomBan = {
  id: string;
  roomId: string;
  reason: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
  bannedBy: {
    id: string;
    username: string;
  };
};

export type RoomInvitation = {
  id: string;
  room: {
    id: string;
    name: string;
    description: string;
    visibility: 'PUBLIC' | 'PRIVATE';
  };
  invitedBy: {
    id: string;
    username: string;
  };
  message: string | null;
  createdAt: string;
};

export type RoomMessage = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  replyTo: {
    id: string;
    text: string;
    author: FriendUser;
  } | null;
  isOwn: boolean;
  author: {
    id: string;
    username: string;
  };
};

export type RoomMessagePage = {
  messages: RoomMessage[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type RoomAttachment = {
  id: string;
  roomId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  comment: string | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    username: string;
  };
};

export type FriendUser = {
  id: string;
  username: string;
  presence?: 'online' | 'afk' | 'offline';
};

export type Friend = FriendUser & {
  since: string;
  presence: 'online' | 'afk' | 'offline';
};

export type BlockedUser = {
  id: string;
  username: string;
  blockedAt: string;
};

export type FriendRequest = {
  id: string;
  message: string | null;
  createdAt: string;
  user: FriendUser;
};

export type FriendState = {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
};

export type DirectChatSummary = {
  id: string;
  friend: FriendUser;
  updatedAt: string;
  unreadCount: number;
  isFrozen: boolean;
  freezeReason: 'blocked_by_you' | 'blocked_by_other' | null;
  lastMessage: {
    id: string;
    text: string;
    createdAt: string;
    author: FriendUser;
  } | null;
};

export type DirectMessage = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  replyTo: {
    id: string;
    text: string;
    author: FriendUser;
  } | null;
  isOwn: boolean;
  author: FriendUser;
};

export type DirectAttachment = {
  id: string;
  directChatId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  comment: string | null;
  createdAt: string;
  uploadedBy: FriendUser;
};

export type DirectMessagesPayload = {
  messages: DirectMessage[];
  isFrozen: boolean;
  freezeReason: 'blocked_by_you' | 'blocked_by_other' | null;
};

export type AuthMode = 'login' | 'register';

export type AuthFormState = {
  email: string;
  username: string;
  password: string;
};

export type CreateRoomState = {
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
};
