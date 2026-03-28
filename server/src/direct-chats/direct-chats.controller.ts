import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { DirectChatsService } from './direct-chats.service';

@Controller('direct-chats')
export class DirectChatsController {
  constructor(
    private readonly directChatsService: DirectChatsService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Get()
  async listChats(@Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      chats: await this.directChatsService.listChats(user),
    };
  }

  @Get(':friendId/messages')
  async listMessages(
    @Param('friendId') friendId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      messages: await this.directChatsService.listMessages(user, friendId),
    };
  }

  @Post(':friendId/messages')
  async sendMessage(
    @Param('friendId') friendId: string,
    @Body() body: CreateDirectMessageDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      message: await this.directChatsService.sendMessage(user, friendId, body),
    };
  }
}
