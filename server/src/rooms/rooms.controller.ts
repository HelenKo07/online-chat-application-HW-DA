import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Get()
  async listRooms(@Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      rooms: await this.roomsService.listRooms(user.id),
    };
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      room: await this.roomsService.getRoomDetails(roomId, user.id),
    };
  }

  @Post()
  async createRoom(@Body() body: CreateRoomDto, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      room: await this.roomsService.createRoom(user, body),
    };
  }

  @Post(':roomId/join')
  async joinRoom(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      room: await this.roomsService.joinRoom(roomId, user),
    };
  }

  @Post(':roomId/leave')
  async leaveRoom(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.leaveRoom(roomId, user);
  }
}
