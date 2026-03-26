import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body);
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
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);
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
}
