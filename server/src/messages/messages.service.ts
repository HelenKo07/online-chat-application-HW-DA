import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomRole } from '@prisma/client';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MessagesService {
  constructor(private readonly database: DatabaseService) {}

  async listRoomMessages(
    roomId: string,
    userId: string,
    options?: { before?: string; limit?: number },
  ) {
    await this.ensureRoomMember(roomId, userId);
    const pageSize = options?.limit ?? 30;
    const beforeMessageId = options?.before;

    let beforeCreatedAt: Date | undefined;

    if (beforeMessageId) {
      const beforeMessage = await this.database.message.findFirst({
        where: {
          id: beforeMessageId,
          roomId,
        },
        select: {
          createdAt: true,
        },
      });

      beforeCreatedAt = beforeMessage?.createdAt;
    }

    const messages = await this.database.message.findMany({
      where: {
        roomId,
        ...(beforeCreatedAt
          ? {
              createdAt: {
                lt: beforeCreatedAt,
              },
            }
          : {}),
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
        createdAt: 'desc',
      },
      take: pageSize + 1,
    });

    if (!beforeMessageId) {
      await this.database.roomRead.upsert({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          userId,
          roomId,
          lastReadAt: new Date(),
        },
      });
    }

    const hasMore = messages.length > pageSize;
    const page = hasMore ? messages.slice(0, pageSize) : messages;
    const normalizedPage = [...page].reverse();

    return {
      messages: normalizedPage.map((message) => this.toClientMessage(message, userId)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    };
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

  async deleteRoomMessage(roomId: string, messageId: string, userId: string) {
    const message = await this.database.message.findFirst({
      where: {
        id: messageId,
        roomId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      const membership = await this.database.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
        select: {
          role: true,
        },
      });

      if (
        !membership ||
        (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.ADMIN)
      ) {
        throw new ForbiddenException('Only admins can delete messages by other users');
      }
    }

    await this.database.message.delete({
      where: {
        id: message.id,
      },
    });

    return {
      success: true,
      roomId,
      messageId,
    };
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
