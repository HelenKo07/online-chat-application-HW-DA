import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { SessionAuthService } from '../auth/session-auth.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AttachmentsService } from './attachments.service';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const memoryStorage: () => unknown = require('multer').memoryStorage;

@Controller('rooms/:roomId/attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Get()
  async listRoomAttachments(
    @Param('roomId') roomId: string,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      attachments: await this.attachmentsService.listRoomAttachments(roomId, user.id),
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async uploadRoomAttachment(
    @Param('roomId') roomId: string,
    @UploadedFile() file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    } | undefined,
    @Body() body: UploadAttachmentDto,
    @Req() request: Request,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    return {
      attachment: await this.attachmentsService.uploadRoomAttachment(roomId, user, file, body),
    };
  }

  @Get(':attachmentId/download')
  async downloadAttachment(
    @Param('roomId') roomId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const user = await this.sessionAuthService.requireUser(request);
    const payload = await this.attachmentsService.getDownloadPayload(
      roomId,
      attachmentId,
      user.id,
    );

    response.download(payload.absolutePath, payload.originalName);
  }
}
