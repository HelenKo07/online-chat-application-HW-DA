export type AuthUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
};

export type RoomMember = {
  id: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
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
  members: RoomMember[];
};

export type RoomMessage = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  isOwn: boolean;
  author: {
    id: string;
    username: string;
  };
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
