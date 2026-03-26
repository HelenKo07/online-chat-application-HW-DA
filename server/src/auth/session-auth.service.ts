import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class SessionAuthService {
  constructor(private readonly authService: AuthService) {}

  async requireUser(request: Request) {
    const sessionToken =
      request.cookies?.[this.authService.getSessionCookieName()];
    const user = await this.authService.getCurrentUser(sessionToken);

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
