import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFriendRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  username!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  message?: string;
}
