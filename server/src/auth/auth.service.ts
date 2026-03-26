import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';

const SESSION_COOKIE_NAME = 'chat_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_SALT_BYTES = 16;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly database: DatabaseService,
  ) {}

  getSessionCookieName() {
    return SESSION_COOKIE_NAME;
  }

  async register(input: { email: string; username: string; password: string }) {
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

    const session = await this.createSession(user.id);

    return {
      session,
      user: this.toSafeUser(user),
    };
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.createSession(user.id);

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

  private async createSession(userId: string) {
    const token = randomBytes(48).toString('hex');
    const session = await this.database.session.create({
      data: {
        userId,
        tokenHash: this.hashSessionToken(token),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
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

  private toSafeUser(user: SessionUser) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
