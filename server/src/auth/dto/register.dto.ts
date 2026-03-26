import { IsEmail, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username may contain only letters, numbers, and underscores',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
