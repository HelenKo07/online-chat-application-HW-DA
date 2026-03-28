import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class PresenceHeartbeatDto {
  @IsBoolean()
  isActive!: boolean;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  tabId!: string;
}
