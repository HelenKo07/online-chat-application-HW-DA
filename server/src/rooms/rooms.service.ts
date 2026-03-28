import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomRole, RoomVisibility } from '@prisma/client';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly presenceService: PresenceService,
  ) {}

  async listRooms(userId: string) {
    const rooms = await this.database.room.findMany({
      where: {
        OR: [
          { visibility: RoomVisibility.PUBLIC },
          { memberships: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    const roomReads = await this.database.roomRead.findMany({
      where: {
        userId,
        roomId: {
          in: rooms.map((room) => room.id),
        },
      },
    });

    return Promise.all(
      rooms.map((room) =>
        this.toRoomSummary(
          room,
          userId,
          roomReads.find((entry) => entry.roomId === room.id)?.lastReadAt,
        ),
      ),
    );
  }

  async getRoomDetails(roomId: string, userId: string) {
    const room = await this.database.room.findUnique({
      where: { id: roomId },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isMember = room.memberships.some((membership) => membership.userId === userId);

    if (room.visibility === RoomVisibility.PRIVATE && !isMember) {
      throw new ForbiddenException('You do not have access to this room');
    }

    const read = await this.database.roomRead.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    return this.toRoomSummary(room, userId, read?.lastReadAt);
  }

  async createRoom(user: SessionUser, input: { name: string; description: string; visibility?: 'PUBLIC' | 'PRIVATE' }) {
    const normalizedName = input.name.trim();
    const existingRoom = await this.database.room.findUnique({
      where: { name: normalizedName },
    });

    if (existingRoom) {
      throw new BadRequestException('Room name is already taken');
    }

    const room = await this.database.room.create({
      data: {
        name: normalizedName,
        description: input.description.trim(),
        visibility: input.visibility === 'PRIVATE' ? RoomVisibility.PRIVATE : RoomVisibility.PUBLIC,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: RoomRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    });

    return this.toRoomSummary(room, user.id);
  }

  async joinRoom(roomId: string, user: SessionUser) {
    const room = await this.database.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: true,
        owner: {
          select: { id: true, username: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isBanned = await this.database.roomBan.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id,
        },
      },
    });

    if (isBanned) {
      throw new ForbiddenException('You are banned from this room');
    }

    const membership = room.memberships.find((entry) => entry.userId === user.id);
    const invitation = await this.database.roomInvitation.findUnique({
      where: {
        roomId_invitedUserId: {
          roomId,
          invitedUserId: user.id,
        },
      },
    });

    if (!membership && room.visibility === RoomVisibility.PRIVATE && !invitation) {
      throw new ForbiddenException('Private rooms can be joined by invitation only');
    }

    if (!membership) {
      await this.database.roomMember.create({
        data: {
          roomId,
          userId: user.id,
          role: RoomRole.MEMBER,
        },
      });
    }

    if (invitation) {
      await this.database.roomInvitation.delete({
        where: {
          id: invitation.id,
        },
      });
    }

    await this.database.roomRead.upsert({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId,
        },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        userId: user.id,
        roomId,
        lastReadAt: new Date(),
      },
    });

    return this.getRoomDetails(roomId, user.id);
  }

  async leaveRoom(roomId: string, user: SessionUser) {
    const membership = await this.database.roomMember.findFirst({
      where: {
        roomId,
        userId: user.id,
      },
      include: {
        room: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === RoomRole.OWNER) {
      throw new BadRequestException('Room owner cannot leave their own room');
    }

    await this.database.roomMember.delete({
      where: {
        id: membership.id,
      },
    });

    return {
      success: true,
      roomId,
    };
  }

  async deleteRoom(roomId: string, user: SessionUser) {
    await this.requireOwnerMembership(roomId, user.id);

    await this.database.room.delete({
      where: { id: roomId },
    });

    return {
      success: true,
      roomId,
    };
  }

  async promoteAdmin(roomId: string, user: SessionUser, targetUserId: string) {
    await this.requireOwnerMembership(roomId, user.id);

    const targetMembership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Target user is not a room member');
    }

    if (targetMembership.role === RoomRole.OWNER) {
      throw new BadRequestException('Owner role cannot be changed');
    }

    if (targetMembership.role === RoomRole.ADMIN) {
      return {
        success: true,
        roomId,
        userId: targetUserId,
        role: RoomRole.ADMIN,
      };
    }

    await this.database.roomMember.update({
      where: {
        id: targetMembership.id,
      },
      data: {
        role: RoomRole.ADMIN,
      },
    });

    return {
      success: true,
      roomId,
      userId: targetUserId,
      role: RoomRole.ADMIN,
    };
  }

  async demoteAdmin(roomId: string, user: SessionUser, targetUserId: string) {
    const actorMembership = await this.requireAdminMembership(roomId, user.id);
    const targetMembership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Target user is not a room member');
    }

    if (targetMembership.role === RoomRole.OWNER) {
      throw new BadRequestException('Owner role cannot be changed');
    }

    if (targetMembership.role !== RoomRole.ADMIN) {
      throw new BadRequestException('Target user is not an admin');
    }

    if (actorMembership.role !== RoomRole.OWNER) {
      if (targetUserId === user.id) {
        throw new ForbiddenException('Admins can remove admin role only from other admins');
      }
    }

    await this.database.roomMember.update({
      where: {
        id: targetMembership.id,
      },
      data: {
        role: RoomRole.MEMBER,
      },
    });

    return {
      success: true,
      roomId,
      userId: targetUserId,
      role: RoomRole.MEMBER,
    };
  }

  async removeMember(roomId: string, user: SessionUser, targetUserId: string) {
    await this.applyBan(roomId, user, targetUserId, 'Removed by moderator');
    return {
      success: true,
      roomId,
      userId: targetUserId,
      banned: true,
    };
  }

  async listBans(roomId: string, user: SessionUser) {
    await this.requireAdminMembership(roomId, user.id);

    const bans = await this.database.roomBan.findMany({
      where: { roomId },
      include: {
        user: {
          select: { id: true, username: true },
        },
        bannedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bans.map((ban) => ({
      id: ban.id,
      roomId: ban.roomId,
      reason: ban.reason,
      createdAt: ban.createdAt,
      user: ban.user,
      bannedBy: ban.bannedBy,
    }));
  }

  async banUser(
    roomId: string,
    user: SessionUser,
    input: { userId: string; reason?: string },
  ) {
    await this.applyBan(roomId, user, input.userId, input.reason?.trim());
    return {
      success: true,
      roomId,
      userId: input.userId,
      banned: true,
    };
  }

  async unbanUser(roomId: string, user: SessionUser, targetUserId: string) {
    await this.requireAdminMembership(roomId, user.id);

    await this.database.roomBan.deleteMany({
      where: {
        roomId,
        userId: targetUserId,
      },
    });

    return {
      success: true,
      roomId,
      userId: targetUserId,
      banned: false,
    };
  }

  async inviteToPrivateRoom(
    roomId: string,
    user: SessionUser,
    input: { username: string; message?: string },
  ) {
    const room = await this.database.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.visibility !== RoomVisibility.PRIVATE) {
      throw new BadRequestException('Invitations are available only for private rooms');
    }

    const actorMembership = room.memberships.find((entry) => entry.userId === user.id);

    if (!actorMembership) {
      throw new ForbiddenException('Only room members can invite users');
    }

    const username = input.username.trim().toLowerCase();
    const targetUser = await this.database.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.id === user.id) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const targetMembership = room.memberships.find((entry) => entry.userId === targetUser.id);

    if (targetMembership) {
      throw new BadRequestException('User is already a room member');
    }

    const ban = await this.database.roomBan.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUser.id,
        },
      },
    });

    if (ban) {
      throw new BadRequestException('Cannot invite a banned user');
    }

    const invitation = await this.database.roomInvitation.upsert({
      where: {
        roomId_invitedUserId: {
          roomId,
          invitedUserId: targetUser.id,
        },
      },
      update: {
        invitedById: user.id,
        message: input.message?.trim() || null,
      },
      create: {
        roomId,
        invitedUserId: targetUser.id,
        invitedById: user.id,
        message: input.message?.trim() || null,
      },
      include: {
        room: {
          select: { id: true, name: true },
        },
        invitedUser: {
          select: { id: true, username: true },
        },
        invitedBy: {
          select: { id: true, username: true },
        },
      },
    });

    return {
      id: invitation.id,
      room: invitation.room,
      invitedUser: invitation.invitedUser,
      invitedBy: invitation.invitedBy,
      message: invitation.message,
      createdAt: invitation.createdAt,
    };
  }

  async listMyInvitations(userId: string) {
    const invitations = await this.database.roomInvitation.findMany({
      where: {
        invitedUserId: userId,
      },
      include: {
        room: {
          select: { id: true, name: true, description: true, visibility: true },
        },
        invitedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      room: invitation.room,
      invitedBy: invitation.invitedBy,
      message: invitation.message,
      createdAt: invitation.createdAt,
    }));
  }

  async acceptInvitation(roomId: string, user: SessionUser) {
    const invitation = await this.database.roomInvitation.findUnique({
      where: {
        roomId_invitedUserId: {
          roomId,
          invitedUserId: user.id,
        },
      },
      include: {
        room: {
          select: { id: true, visibility: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.room.visibility !== RoomVisibility.PRIVATE) {
      throw new BadRequestException('Invitation is not valid for this room');
    }

    const ban = await this.database.roomBan.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id,
        },
      },
    });

    if (ban) {
      throw new ForbiddenException('You are banned from this room');
    }

    await this.database.$transaction([
      this.database.roomMember.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: user.id,
          },
        },
        update: {},
        create: {
          roomId,
          userId: user.id,
          role: RoomRole.MEMBER,
        },
      }),
      this.database.roomInvitation.delete({
        where: {
          id: invitation.id,
        },
      }),
      this.database.roomRead.upsert({
        where: {
          userId_roomId: {
            userId: user.id,
            roomId,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          userId: user.id,
          roomId,
          lastReadAt: new Date(),
        },
      }),
    ]);

    return this.getRoomDetails(roomId, user.id);
  }

  async declineInvitation(roomId: string, userId: string) {
    await this.database.roomInvitation.deleteMany({
      where: {
        roomId,
        invitedUserId: userId,
      },
    });

    return {
      success: true,
      roomId,
    };
  }

  private async applyBan(
    roomId: string,
    actor: SessionUser,
    targetUserId: string,
    reason?: string,
  ) {
    const actorMembership = await this.requireAdminMembership(roomId, actor.id);

    if (targetUserId === actor.id) {
      throw new BadRequestException('You cannot ban yourself');
    }

    const targetUser = await this.database.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const targetMembership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
    });

    if (targetMembership?.role === RoomRole.OWNER) {
      throw new BadRequestException('Owner cannot be banned');
    }

    if (actorMembership.role !== RoomRole.OWNER && targetMembership?.role === RoomRole.ADMIN) {
      throw new ForbiddenException('Only owner can ban admins');
    }

    await this.database.$transaction([
      this.database.roomBan.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: targetUserId,
          },
        },
        update: {
          bannedById: actor.id,
          reason: reason || null,
        },
        create: {
          roomId,
          userId: targetUserId,
          bannedById: actor.id,
          reason: reason || null,
        },
      }),
      this.database.roomMember.deleteMany({
        where: {
          roomId,
          userId: targetUserId,
        },
      }),
      this.database.roomInvitation.deleteMany({
        where: {
          roomId,
          invitedUserId: targetUserId,
        },
      }),
      this.database.roomRead.deleteMany({
        where: {
          roomId,
          userId: targetUserId,
        },
      }),
    ]);
  }

  private async requireOwnerMembership(roomId: string, userId: string) {
    const membership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only room owner can perform this action');
    }

    if (membership.role !== RoomRole.OWNER) {
      throw new ForbiddenException('Only room owner can perform this action');
    }

    return membership;
  }

  private async requireAdminMembership(roomId: string, userId: string) {
    const membership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only room admins can perform this action');
    }

    if (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.ADMIN) {
      throw new ForbiddenException('Only room admins can perform this action');
    }

    return membership;
  }

  private toRoomSummary(
    room: {
      id: string;
      name: string;
      description: string;
      visibility: RoomVisibility;
      owner: { id: string; username: string };
      memberships: Array<{
        id: string;
        userId: string;
        role: RoomRole;
        joinedAt: Date;
        user: { id: string; username: string };
      }>;
      createdAt?: Date;
    },
    userId: string,
    lastReadAt?: Date,
  ) {
    const membership = room.memberships.find((entry) => entry.userId === userId);
    const memberIds = room.memberships.map((entry) => entry.user.id);

    return this.buildRoomSummary(room, userId, membership, memberIds, lastReadAt);
  }

  private async buildRoomSummary(
    room: {
      id: string;
      name: string;
      description: string;
      visibility: RoomVisibility;
      owner: { id: string; username: string };
      memberships: Array<{
        id: string;
        userId: string;
        role: RoomRole;
        joinedAt: Date;
        user: { id: string; username: string };
      }>;
    },
    userId: string,
    membership:
      | {
          id: string;
          userId: string;
          role: RoomRole;
          joinedAt: Date;
          user: { id: string; username: string };
        }
      | undefined,
    memberIds: string[],
    lastReadAt?: Date,
  ) {
    const [statuses, unreadCount] = await Promise.all([
      this.presenceService.getStatuses(memberIds),
      this.database.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Message"
        WHERE "roomId" = ${room.id}
          AND "createdAt" > ${lastReadAt ?? new Date(0)}
          AND "authorId" <> ${userId}
      `,
    ]);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      visibility: room.visibility,
      owner: room.owner,
      membersCount: room.memberships.length,
      isMember: Boolean(membership),
      currentUserRole: membership?.role ?? null,
      unreadCount: membership ? Number(unreadCount[0]?.count ?? 0n) : 0,
      members: room.memberships.map((entry) => ({
        id: entry.user.id,
        username: entry.user.username,
        role: entry.role,
        joinedAt: entry.joinedAt,
        presence: statuses.get(entry.user.id) ?? 'offline',
      })),
    };
  }
}
