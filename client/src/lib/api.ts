import { AuthUser, CreateRoomState, Room, RoomMessage } from '../types/api';

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
  me: async () => apiRequest<{ user: AuthUser }>('/auth/me'),
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
  getRoomMessages: async (roomId: string) =>
    apiRequest<{ messages: RoomMessage[] }>(`/rooms/${roomId}/messages`),
  sendRoomMessage: async (roomId: string, payload: { text: string }) =>
    apiRequest<{ message: RoomMessage }>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  joinRoom: async (roomId: string) =>
    apiRequest<{ room: Room }>(`/rooms/${roomId}/join`, {
      method: 'POST',
    }),
  leaveRoom: async (roomId: string) =>
    apiRequest<{ success: true; roomId: string }>(`/rooms/${roomId}/leave`, {
      method: 'POST',
    }),
};
