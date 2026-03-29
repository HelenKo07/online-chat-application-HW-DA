import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';

const SESSION_COOKIE_NAME = 'chat_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_SALT_BYTES = 16;
const DELETED_USER_USERNAME = '__deleted_user__';

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly database: DatabaseService,
  ) {}

  getSessionCookieName() {
    return SESSION_COOKIE_NAME;
  }

  async register(
    input: { email: string; username: string; password: string },
    meta?: SessionMeta,
  ) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();

    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.findByEmail(email),
      this.usersService.findByUsername(username),
    ]);

    if (existingEmail) {
      throw new BadRequestException('Email is already registered');
    }

    if (existingUsername) {
      throw new BadRequestException('Username is already taken');
    }

    const passwordHash = this.hashPassword(input.password);
    const user = await this.usersService.createUser({
      email,
      username,
      passwordHash,
    });

    const session = await this.createSession(user.id, meta);

    return {
      session,
      user: this.toSafeUser(user),
    };
  }

  async login(input: { email: string; password: string }, meta?: SessionMeta) {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.createSession(user.id, meta);

    return {
      session,
      user: this.toSafeUser(user),
    };
  }

  async logout(rawToken?: string) {
    if (!rawToken) {
      return;
    }

    await this.database.session.deleteMany({
      where: {
        tokenHash: this.hashSessionToken(rawToken),
      },
    });
  }

  async getCurrentUser(rawToken?: string) {
    if (!rawToken) {
      return null;
    }

    const session = await this.database.session.findUnique({
      where: {
        tokenHash: this.hashSessionToken(rawToken),
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      await this.database.session.delete({
        where: { id: session.id },
      });
      return null;
    }

    return this.toSafeUser(session.user);
  }

  async listSessions(userId: string, rawToken?: string) {
    const currentTokenHash = rawToken ? this.hashSessionToken(rawToken) : null;
    const sessions = await this.database.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: currentTokenHash === session.tokenHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.database.session.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    return { success: true };
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
  ) {
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('New password must differ from current password');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.verifyPassword(input.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.database.user.update({
      where: { id: userId },
      data: {
        passwordHash: this.hashPassword(input.newPassword),
      },
    });

    return { success: true };
  }

  async resetPassword(input: { email: string; newPassword: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { success: true };
    }

    await this.database.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: this.hashPassword(input.newPassword),
      },
    });

    return { success: true };
  }

  async deleteAccount(userId: string, currentPassword: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const deletedUser = await this.ensureDeletedUserAccount();

    if (deletedUser.id === userId) {
      throw new BadRequestException('System account cannot be deleted');
    }

    await this.database.$transaction(async (tx) => {
      await tx.room.deleteMany({
        where: {
          ownerId: userId,
        },
      });

      await tx.message.updateMany({
        where: {
          authorId: userId,
        },
        data: {
          authorId: deletedUser.id,
        },
      });

      await tx.roomAttachment.updateMany({
        where: {
          uploadedById: userId,
        },
        data: {
          uploadedById: deletedUser.id,
        },
      });

      await tx.directMessage.updateMany({
        where: {
          authorId: userId,
        },
        data: {
          authorId: deletedUser.id,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId,
        },
      });

      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    return { success: true };
  }

  buildSessionCookie(token: string) {
    return {
      name: SESSION_COOKIE_NAME,
      value: token,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: false,
        path: '/',
        expires: new Date(Date.now() + SESSION_TTL_MS),
      },
    };
  }

  clearSessionCookie() {
    return {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: false,
        path: '/',
      },
    };
  }

  private async createSession(userId: string, meta?: SessionMeta) {
    const token = randomBytes(48).toString('hex');
    const session = await this.database.session.create({
      data: {
        userId,
        tokenHash: this.hashSessionToken(token),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        userAgent: meta?.userAgent?.slice(0, 500) || null,
        ipAddress: meta?.ipAddress?.slice(0, 120) || null,
      },
    });

    return {
      id: session.id,
      token,
      expiresAt: session.expiresAt,
    };
  }

  private hashPassword(password: string) {
    const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, originalHash] = storedHash.split(':');

    if (!salt || !originalHash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const original = Buffer.from(originalHash, 'hex');

    return (
      derived.length === original.length && timingSafeEqual(derived, original)
    );
  }

  private hashSessionToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async ensureDeletedUserAccount() {
    const existing = await this.usersService.findByUsername(DELETED_USER_USERNAME);
    if (existing) {
      return existing;
    }

    const randomSuffix = randomBytes(12).toString('hex');

    try {
      return await this.usersService.createUser({
        email: `deleted-user-${randomSuffix}@system.local`,
        username: DELETED_USER_USERNAME,
        passwordHash: this.hashPassword(randomBytes(32).toString('hex')),
      });
    } catch {
      const created = await this.usersService.findByUsername(DELETED_USER_USERNAME);
      if (!created) {
        throw new BadRequestException('Failed to prepare deleted user account');
      }
      return created;
    }
  }

  private toSafeUser(user: SessionUser) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
