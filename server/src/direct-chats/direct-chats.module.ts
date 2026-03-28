import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FriendsModule } from '../friends/friends.module';
import { PresenceModule } from '../presence/presence.module';
import { DirectChatsController } from './direct-chats.controller';
import { DirectChatsService } from './direct-chats.service';

@Module({
  imports: [AuthModule, FriendsModule, PresenceModule],
  controllers: [DirectChatsController],
  providers: [DirectChatsService],
})
export class DirectChatsModule {}
