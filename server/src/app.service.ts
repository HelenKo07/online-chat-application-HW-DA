import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'chat-server',
      timestamp: new Date().toISOString(),
    };
  }

  getMeta() {
    return {
      name: 'Online Chat Application',
      stage: 'foundation',
      stack: {
        client: 'React + TypeScript + Vite',
        server: 'NestJS',
        realtime: 'Socket.IO (planned)',
        database: 'PostgreSQL + Prisma',
      },
      modules: [
        'auth',
        'users',
        'sessions',
        'rooms',
        'room-memberships',
        'messages',
        'friends',
        'direct-chats',
        'direct-messages',
        'presence',
        'room-unread',
        'direct-unread',
      ],
    };
  }
}
