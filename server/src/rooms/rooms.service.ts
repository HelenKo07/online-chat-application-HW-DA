import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomRole, RoomVisibility } from '@prisma/client';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RoomsService {
  constructor(private readonly database: DatabaseService) {}

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

    return rooms.map((room) => this.toRoomSummary(room, userId));
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

    return this.toRoomSummary(room, userId);
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

    if (room.visibility !== RoomVisibility.PUBLIC) {
      throw new ForbiddenException('Only public rooms can be joined directly');
    }

    const membership = room.memberships.find((entry) => entry.userId === user.id);

    if (!membership) {
      await this.database.roomMember.create({
        data: {
          roomId,
          userId: user.id,
          role: RoomRole.MEMBER,
        },
      });
    }

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
  ) {
    const membership = room.memberships.find((entry) => entry.userId === userId);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      visibility: room.visibility,
      owner: room.owner,
      membersCount: room.memberships.length,
      isMember: Boolean(membership),
      currentUserRole: membership?.role ?? null,
      members: room.memberships.map((entry) => ({
        id: entry.user.id,
        username: entry.user.username,
        role: entry.role,
        joinedAt: entry.joinedAt,
      })),
    };
  }
}
