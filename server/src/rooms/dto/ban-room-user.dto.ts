import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanRoomUserDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}
