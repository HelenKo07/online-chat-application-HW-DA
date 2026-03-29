import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionUser } from '../common/session-user.type';
import { normalizeUserPair } from '../common/user-pair';
import { DatabaseService } from '../database/database.service';
import { FriendsService } from '../friends/friends.service';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class DirectChatsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly friendsService: FriendsService,
    private readonly presenceService: PresenceService,
  ) {}

  async listChats(user: SessionUser) {
    const chats = await this.database.directChat.findMany({
      where: {
        OR: [{ lowUserId: user.id }, { highUserId: user.id }],
      },
      include: {
        lowUser: { select: { id: true, username: true } },
        highUser: { select: { id: true, username: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const friendIds = chats.map((chat) =>
      chat.lowUserId === user.id ? chat.highUserId : chat.lowUserId,
    );
    const statuses = await this.presenceService.getStatuses(friendIds);

    return Promise.all(chats.map(async (chat) => {
      const friend = chat.lowUserId === user.id ? chat.highUser : chat.lowUser;
      const lastMessage = chat.messages[0] ?? null;
      const blockState = await this.friendsService.getBlockState(user.id, friend.id);
      const read = await this.database.directChatRead.findUnique({
        where: {
          userId_directChatId: {
            userId: user.id,
            directChatId: chat.id,
          },
        },
      });
      const unreadCount = await this.database.directMessage.count({
        where: {
          directChatId: chat.id,
          createdAt: {
            gt: read?.lastReadAt ?? new Date(0),
          },
          authorId: {
            not: user.id,
          },
        },
      });

      return {
        id: chat.id,
        friend: {
          ...friend,
          presence: statuses.get(friend.id) ?? 'offline',
        },
        updatedAt: chat.updatedAt,
        unreadCount,
        isFrozen: blockState.blocked,
        freezeReason: blockState.blocked
          ? blockState.blockedByActor
            ? 'blocked_by_you'
            : 'blocked_by_other'
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              author: lastMessage.author,
            }
          : null,
      };
    }));
  }

  async listMessages(user: SessionUser, friendId: string) {
    const chat = await this.getOrCreateChat(user.id, friendId, false);
    const blockState = await this.friendsService.getBlockState(user.id, friendId);

    if (!chat) {
      return {
        messages: [],
        isFrozen: blockState.blocked,
        freezeReason: blockState.blocked
          ? blockState.blockedByActor
            ? 'blocked_by_you'
            : 'blocked_by_other'
          : null,
      };
    }

    const messages = await this.database.directMessage.findMany({
      where: {
        directChatId: chat.id,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    await this.database.directChatRead.upsert({
      where: {
        userId_directChatId: {
          userId: user.id,
          directChatId: chat.id,
        },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        userId: user.id,
        directChatId: chat.id,
        lastReadAt: new Date(),
      },
    });

    return {
      messages: messages.map((message) => ({
        id: message.id,
        text: message.text,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        author: message.author,
        isOwn: message.author.id === user.id,
      })),
      isFrozen: blockState.blocked,
      freezeReason: blockState.blocked
        ? blockState.blockedByActor
          ? 'blocked_by_you'
          : 'blocked_by_other'
        : null,
    };
  }

  async sendMessage(user: SessionUser, friendId: string, input: { text: string }) {
    const blockState = await this.friendsService.getBlockState(user.id, friendId);
    if (blockState.blocked) {
      throw new ForbiddenException('Direct chat is frozen due to user ban');
    }

    const chat = await this.getOrCreateChat(user.id, friendId, true);

    if (!chat) {
      throw new NotFoundException('Direct chat not found');
    }

    const message = await this.database.directMessage.create({
      data: {
        directChatId: chat.id,
        authorId: user.id,
        text: input.text.trim(),
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    await this.database.directChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      author: message.author,
      isOwn: true,
    };
  }

  async editMessage(
    user: SessionUser,
    friendId: string,
    messageId: string,
    input: { text: string },
  ) {
    const blockState = await this.friendsService.getBlockState(user.id, friendId);
    if (blockState.blocked) {
      throw new ForbiddenException('Direct chat is frozen due to user ban');
    }

    const chat = await this.getOrCreateChat(user.id, friendId, false);
    if (!chat) {
      throw new NotFoundException('Direct chat not found');
    }

    const message = await this.database.directMessage.findFirst({
      where: {
        id: messageId,
        directChatId: chat.id,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.database.directMessage.update({
      where: {
        id: message.id,
      },
      data: {
        text: input.text.trim(),
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    await this.database.directChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    return {
      id: updated.id,
      text: updated.text,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      author: updated.author,
      isOwn: true,
    };
  }

  private async getOrCreateChat(userId: string, friendId: string, createIfMissing: boolean) {
    const friend = await this.database.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    });

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    const pair = normalizeUserPair(userId, friendId);

    const existing = await this.database.directChat.findUnique({
      where: {
        lowUserId_highUserId: pair,
      },
    });

    if (existing) {
      return existing;
    }

    if (!createIfMissing) {
      return null;
    }

    await this.friendsService.assertFriends(userId, friendId);

    return this.database.directChat.create({
      data: pair,
    });
  }
}
