import { IsBoolean } from 'class-validator';

export class PresenceHeartbeatDto {
  @IsBoolean()
  isActive!: boolean;
}
