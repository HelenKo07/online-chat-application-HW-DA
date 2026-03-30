import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { DirectAttachmentsController } from './direct-attachments.controller';

@Module({
  imports: [AuthModule],
  controllers: [AttachmentsController, DirectAttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
