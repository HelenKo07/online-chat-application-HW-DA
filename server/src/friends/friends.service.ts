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
    const [incomingRequests, outgoingRequests, friendships, blockedUsers] = await Promise.all([
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
      this.database.userBlock.findMany({
        where: {
          blockerId: user.id,
        },
        include: {
          blocked: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
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
      blockedUsers: blockedUsers.map((entry) => ({
        id: entry.blocked.id,
        username: entry.blocked.username,
        blockedAt: entry.createdAt,
      })),
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

    const blocked = await this.getBlockState(user.id, target.id);
    if (blocked.blockedByActor || blocked.blockedByTarget) {
      throw new ForbiddenException('Friend request is blocked by user ban');
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

    const blocked = await this.getBlockState(request.receiverId, request.senderId);
    if (blocked.blockedByActor || blocked.blockedByTarget) {
      throw new ForbiddenException('Friendship is blocked');
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
    const blocked = await this.getBlockState(userId, otherUserId);
    if (blocked.blockedByActor || blocked.blockedByTarget) {
      throw new ForbiddenException('Direct messages are blocked');
    }

    const friendship = await this.findFriendship(userId, otherUserId);

    if (!friendship) {
      throw new ForbiddenException('Direct messages are available only between friends');
    }

    return friendship;
  }

  async blockUser(user: SessionUser, targetUserId: string) {
    if (targetUserId === user.id) {
      throw new BadRequestException('You cannot block yourself');
    }

    const target = await this.usersService.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const pair = normalizeUserPair(user.id, targetUserId);

    await this.database.$transaction([
      this.database.userBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: targetUserId,
          },
        },
        update: {},
        create: {
          blockerId: user.id,
          blockedId: targetUserId,
        },
      }),
      this.database.friendship.deleteMany({
        where: {
          lowUserId: pair.lowUserId,
          highUserId: pair.highUserId,
        },
      }),
      this.database.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: user.id },
          ],
        },
      }),
    ]);

    return { success: true };
  }

  async unblockUser(user: SessionUser, targetUserId: string) {
    await this.database.userBlock.deleteMany({
      where: {
        blockerId: user.id,
        blockedId: targetUserId,
      },
    });

    return { success: true };
  }

  async removeFriend(user: SessionUser, targetUserId: string) {
    if (targetUserId === user.id) {
      throw new BadRequestException('You cannot remove yourself from friends');
    }

    const target = await this.usersService.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const pair = normalizeUserPair(user.id, targetUserId);

    await this.database.$transaction([
      this.database.friendship.deleteMany({
        where: {
          lowUserId: pair.lowUserId,
          highUserId: pair.highUserId,
        },
      }),
      this.database.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: user.id },
          ],
        },
      }),
    ]);

    return { success: true };
  }

  async getBlockState(actorUserId: string, targetUserId: string) {
    const [blockedByActor, blockedByTarget] = await Promise.all([
      this.database.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: actorUserId,
            blockedId: targetUserId,
          },
        },
      }),
      this.database.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: targetUserId,
            blockedId: actorUserId,
          },
        },
      }),
    ]);

    return {
      blockedByActor: Boolean(blockedByActor),
      blockedByTarget: Boolean(blockedByTarget),
      blocked: Boolean(blockedByActor || blockedByTarget),
    };
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
