import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { PresenceService } from './presence.service';

@Controller('presence')
export class PresenceController {
  constructor(
    private readonly sessionAuthService: SessionAuthService,
    private readonly presenceService: PresenceService,
  ) {}

  @Post('heartbeat')
  async heartbeat(
    @Body() body: PresenceHeartbeatDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.presenceService.recordHeartbeat(user.id, body.isActive);
  }
}
