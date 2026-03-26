import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthService } from './session-auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthService],
  exports: [AuthService, SessionAuthService],
})
export class AuthModule {}
