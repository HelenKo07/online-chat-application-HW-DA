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
        database: 'PostgreSQL (planned)',
      },
      modules: [
        'auth',
        'users',
        'rooms',
        'messages',
        'friends',
        'presence',
      ],
    };
  }
}
