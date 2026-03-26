import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, RoomsModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
