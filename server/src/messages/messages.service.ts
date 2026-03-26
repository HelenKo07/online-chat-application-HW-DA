import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MessagesService {
  constructor(private readonly database: DatabaseService) {}

  async listRoomMessages(roomId: string, userId: string) {
    await this.ensureRoomMember(roomId, userId);

    const messages = await this.database.message.findMany({
      where: {
        roomId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });

    return messages.map((message) => this.toClientMessage(message, userId));
  }

  async createRoomMessage(
    roomId: string,
    user: SessionUser,
    input: { text: string },
  ) {
    await this.ensureRoomMember(roomId, user.id);

    const message = await this.database.message.create({
      data: {
        roomId,
        authorId: user.id,
        text: input.text.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return this.toClientMessage(message, user.id);
  }

  private async ensureRoomMember(roomId: string, userId: string) {
    const membership = await this.database.roomMember.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    if (membership) {
      return membership;
    }

    const room = await this.database.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    throw new ForbiddenException('Join the room to see or send messages');
  }

  private toClientMessage(
    message: {
      id: string;
      text: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        username: string;
      };
    },
    currentUserId: string,
  ) {
    return {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      author: message.author,
      isOwn: message.author.id === currentUserId,
    };
  }
}
