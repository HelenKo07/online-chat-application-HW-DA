import { RoomVisibility } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(3)
  @MaxLength(48)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(240)
  description!: string;

  @IsOptional()
  @IsEnum(RoomVisibility)
  visibility?: 'PUBLIC' | 'PRIVATE';
}
