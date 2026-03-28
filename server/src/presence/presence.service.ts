import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const ONLINE_WINDOW_MS = 1000 * 70;
const AFK_WINDOW_MS = 1000 * 60;

@Injectable()
export class PresenceService {
  constructor(private readonly database: DatabaseService) {}

  async recordHeartbeat(userId: string, isActive: boolean, _tabId: string) {
    const now = new Date();

    await this.database.userPresence.upsert({
      where: { userId },
      update: {
        lastSeenAt: now,
        ...(isActive ? { lastActiveAt: now } : {}),
      },
      create: {
        userId,
        lastSeenAt: now,
        lastActiveAt: now,
      },
    });

    return {
      status: 'ok',
      recordedAt: now,
    };
  }

  async getStatuses(userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, 'online' | 'afk' | 'offline'>();
    }

    const rows = await this.database.userPresence.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    const statuses = new Map<string, 'online' | 'afk' | 'offline'>();

    for (const userId of userIds) {
      const row = rows.find((item) => item.userId === userId);
      statuses.set(userId, this.resolveStatus(row?.lastSeenAt, row?.lastActiveAt));
    }

    return statuses;
  }

  private resolveStatus(lastSeenAt?: Date, lastActiveAt?: Date) {
    if (!lastSeenAt || !lastActiveAt) {
      return 'offline' as const;
    }

    const now = Date.now();
    const lastSeen = lastSeenAt.getTime();
    const lastActive = lastActiveAt.getTime();

    if (now - lastSeen > ONLINE_WINDOW_MS) {
      return 'offline' as const;
    }

    if (now - lastActive > AFK_WINDOW_MS) {
      return 'afk' as const;
    }

    return 'online' as const;
  }
}
