import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('rooms/:roomId/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Get()
  async listMessages(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);

    return {
      messages: await this.messagesService.listRoomMessages(roomId, user.id),
    };
  }

  @Post()
  async createMessage(
    @Param('roomId') roomId: string,
    @Body() body: CreateMessageDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);

    return {
      message: await this.messagesService.createRoomMessage(roomId, user, body),
    };
  }

  @Delete(':messageId')
  async deleteMessage(
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.messagesService.deleteRoomMessage(roomId, messageId, user.id);
  }
}
