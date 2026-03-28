import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionAuthService } from './session-auth.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body, {
      userAgent: request.get('user-agent'),
      ipAddress: this.getClientIp(request),
    });
    const sessionCookie = this.authService.buildSessionCookie(result.session.token);

    response.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );

    return {
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body, {
      userAgent: request.get('user-agent'),
      ipAddress: this.getClientIp(request),
    });
    const sessionCookie = this.authService.buildSessionCookie(result.session.token);

    response.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionToken = request.cookies?.[this.authService.getSessionCookieName()];
    await this.authService.logout(sessionToken);

    const cookie = this.authService.clearSessionCookie();
    response.clearCookie(cookie.name, cookie.options);

    return {
      success: true,
    };
  }

  @Get('me')
  async me(@Req() request: Request) {
    const sessionToken = request.cookies?.[this.authService.getSessionCookieName()];
    const user = await this.authService.getCurrentUser(sessionToken);

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return {
      user,
    };
  }

  @Get('sessions')
  async listSessions(@Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    const sessionToken = request.cookies?.[this.authService.getSessionCookieName()];

    return {
      sessions: await this.authService.listSessions(user.id, sessionToken),
    };
  }

  @Delete('sessions/:sessionId')
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    const sessionToken = request.cookies?.[this.authService.getSessionCookieName()];
    const sessions = await this.authService.listSessions(user.id, sessionToken);
    const target = sessions.find((session) => session.id === sessionId);

    await this.authService.revokeSession(user.id, sessionId);

    if (target?.isCurrent) {
      const cookie = this.authService.clearSessionCookie();
      response.clearCookie(cookie.name, cookie.options);
    }

    return { success: true };
  }

  @Post('change-password')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.authService.changePassword(user.id, body);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Delete('account')
  async deleteAccount(
    @Body() body: DeleteAccountDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    await this.authService.deleteAccount(user.id, body.currentPassword);

    const sessionToken = request.cookies?.[this.authService.getSessionCookieName()];
    await this.authService.logout(sessionToken);
    const cookie = this.authService.clearSessionCookie();
    response.clearCookie(cookie.name, cookie.options);

    return { success: true };
  }

  private getClientIp(request: Request) {
    const forwarded = request.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() || undefined;
    }

    return request.ip;
  }
}
