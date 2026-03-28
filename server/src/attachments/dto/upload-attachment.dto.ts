import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  comment?: string;
}
