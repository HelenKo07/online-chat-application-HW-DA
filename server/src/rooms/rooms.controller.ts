import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { BanRoomUserDto } from './dto/ban-room-user.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { InviteToRoomDto } from './dto/invite-to-room.dto';
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

  @Delete(':roomId')
  async deleteRoom(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.deleteRoom(roomId, user);
  }

  @Post(':roomId/admins/:targetUserId/promote')
  async promoteAdmin(
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.promoteAdmin(roomId, user, targetUserId);
  }

  @Post(':roomId/admins/:targetUserId/demote')
  async demoteAdmin(
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.demoteAdmin(roomId, user, targetUserId);
  }

  @Post(':roomId/members/:targetUserId/remove')
  async removeMember(
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.removeMember(roomId, user, targetUserId);
  }

  @Get(':roomId/bans')
  async listBans(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      bans: await this.roomsService.listBans(roomId, user),
    };
  }

  @Post(':roomId/bans')
  async banUser(
    @Param('roomId') roomId: string,
    @Body() body: BanRoomUserDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.banUser(roomId, user, body);
  }

  @Delete(':roomId/bans/:targetUserId')
  async unbanUser(
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.unbanUser(roomId, user, targetUserId);
  }

  @Get('invitations/me')
  async listMyInvitations(@Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      invitations: await this.roomsService.listMyInvitations(user.id),
    };
  }

  @Post(':roomId/invitations')
  async inviteToRoom(
    @Param('roomId') roomId: string,
    @Body() body: InviteToRoomDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      invitation: await this.roomsService.inviteToPrivateRoom(roomId, user, body),
    };
  }

  @Post(':roomId/invitations/accept')
  async acceptInvitation(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      room: await this.roomsService.acceptInvitation(roomId, user),
    };
  }

  @Post(':roomId/invitations/decline')
  async declineInvitation(@Param('roomId') roomId: string, @Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.roomsService.declineInvitation(roomId, user.id);
  }
}
