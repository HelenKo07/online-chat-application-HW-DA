import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Get()
  async getFriendState(@Req() request: Request) {
    const user = await this.sessionAuthService.requireUser(request);

    return this.friendsService.getFriendState(user);
  }

  @Post('requests')
  async createRequest(
    @Body() body: CreateFriendRequestDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);

    return {
      request: await this.friendsService.createFriendRequest(user, body),
    };
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(
    @Param('requestId') requestId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.friendsService.acceptFriendRequest(user, requestId);
  }

  @Post('requests/:requestId/decline')
  async declineRequest(
    @Param('requestId') requestId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.friendsService.declineFriendRequest(user, requestId);
  }

  @Post('blocks/:targetUserId')
  async blockUser(
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.friendsService.blockUser(user, targetUserId);
  }

  @Delete('blocks/:targetUserId')
  async unblockUser(
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.friendsService.unblockUser(user, targetUserId);
  }

  @Delete(':targetUserId')
  async removeFriend(
    @Param('targetUserId') targetUserId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return this.friendsService.removeFriend(user, targetUserId);
  }
}
