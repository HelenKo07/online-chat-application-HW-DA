import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionUser } from '../common/session-user.type';
import { normalizeUserPair } from '../common/user-pair';
import { DatabaseService } from '../database/database.service';
import { PresenceService } from '../presence/presence.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
    private readonly presenceService: PresenceService,
  ) {}

  async getFriendState(user: SessionUser) {
    const [incomingRequests, outgoingRequests, friendships] = await Promise.all([
      this.database.friendRequest.findMany({
        where: { receiverId: user.id },
        include: {
          sender: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.database.friendRequest.findMany({
        where: { senderId: user.id },
        include: {
          receiver: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.database.friendship.findMany({
        where: {
          OR: [{ lowUserId: user.id }, { highUserId: user.id }],
        },
        include: {
          lowUser: { select: { id: true, username: true } },
          highUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const friendIds = friendships.map((friendship) =>
      friendship.lowUserId === user.id ? friendship.highUserId : friendship.lowUserId,
    );
    const statuses = await this.presenceService.getStatuses(friendIds);

    return {
      incomingRequests: incomingRequests.map((request) => ({
        id: request.id,
        message: request.message,
        createdAt: request.createdAt,
        user: request.sender,
      })),
      outgoingRequests: outgoingRequests.map((request) => ({
        id: request.id,
        message: request.message,
        createdAt: request.createdAt,
        user: request.receiver,
      })),
      friends: friendships.map((friendship) => {
        const friend =
          friendship.lowUserId === user.id ? friendship.highUser : friendship.lowUser;

        return {
          id: friend.id,
          username: friend.username,
          since: friendship.createdAt,
          presence: statuses.get(friend.id) ?? 'offline',
        };
      }),
    };
  }

  async createFriendRequest(
    user: SessionUser,
    input: { username: string; message?: string },
  ) {
    const target = await this.usersService.findByUsername(input.username.trim().toLowerCase());

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.id === user.id) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    const friendship = await this.findFriendship(user.id, target.id);
    if (friendship) {
      throw new BadRequestException('You are already friends');
    }

    const reverseRequest = await this.database.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: target.id,
          receiverId: user.id,
        },
      },
    });

    if (reverseRequest) {
      throw new BadRequestException('This user has already sent you a friend request');
    }

    try {
      const request = await this.database.friendRequest.create({
        data: {
          senderId: user.id,
          receiverId: target.id,
          message: input.message?.trim() || null,
        },
        include: {
          receiver: {
            select: { id: true, username: true },
          },
        },
      });

      return {
        id: request.id,
        message: request.message,
        createdAt: request.createdAt,
        user: request.receiver,
      };
    } catch {
      throw new BadRequestException('Friend request already exists');
    }
  }

  async acceptFriendRequest(user: SessionUser, requestId: string) {
    const request = await this.database.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== user.id) {
      throw new ForbiddenException('You cannot accept this request');
    }

    const pair = normalizeUserPair(request.senderId, request.receiverId);

    await this.database.$transaction([
      this.database.friendship.upsert({
        where: {
          lowUserId_highUserId: pair,
        },
        update: {},
        create: pair,
      }),
      this.database.friendRequest.delete({
        where: { id: request.id },
      }),
      this.database.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: request.senderId, receiverId: request.receiverId },
            { senderId: request.receiverId, receiverId: request.senderId },
          ],
        },
      }),
    ]);

    return {
      success: true,
      friend: request.sender,
    };
  }

  async declineFriendRequest(user: SessionUser, requestId: string) {
    const request = await this.database.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== user.id) {
      throw new ForbiddenException('You cannot decline this request');
    }

    await this.database.friendRequest.delete({
      where: { id: request.id },
    });

    return { success: true };
  }

  async assertFriends(userId: string, otherUserId: string) {
    const friendship = await this.findFriendship(userId, otherUserId);

    if (!friendship) {
      throw new ForbiddenException('Direct messages are available only between friends');
    }

    return friendship;
  }

  private findFriendship(userIdA: string, userIdB: string) {
    const pair = normalizeUserPair(userIdA, userIdB);

    return this.database.friendship.findUnique({
      where: {
        lowUserId_highUserId: pair,
      },
    });
  }
}
