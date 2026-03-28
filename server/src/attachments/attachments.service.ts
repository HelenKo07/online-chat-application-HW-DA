import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionUser } from '../common/session-user.type';
import { DatabaseService } from '../database/database.service';
import { extname, resolve } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');

type UploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class AttachmentsService {
  constructor(private readonly database: DatabaseService) {}

  async listRoomAttachments(roomId: string, userId: string) {
    await this.ensureRoomMember(roomId, userId);

    const attachments = await this.database.roomAttachment.findMany({
      where: { roomId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return attachments.map((attachment) => ({
      id: attachment.id,
      roomId: attachment.roomId,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      comment: attachment.comment,
      createdAt: attachment.createdAt,
      uploadedBy: attachment.uploadedBy,
    }));
  }

  async uploadRoomAttachment(
    roomId: string,
    user: SessionUser,
    file: UploadFile | undefined,
    input: { comment?: string },
  ) {
    await this.ensureRoomMember(roomId, user.id);

    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.validateFile(file);

    const roomDir = resolve(UPLOADS_ROOT, roomId);
    await mkdir(roomDir, { recursive: true });

    const safeExtension = extname(file.originalname).slice(0, 20);
    const generatedName = `${randomUUID()}${safeExtension}`;
    const relativePath = `${roomId}/${generatedName}`;
    const absolutePath = resolve(UPLOADS_ROOT, relativePath);

    await writeFile(absolutePath, file.buffer);

    const attachment = await this.database.roomAttachment.create({
      data: {
        roomId,
        uploadedById: user.id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath: relativePath,
        comment: input.comment?.trim() || null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return {
      id: attachment.id,
      roomId: attachment.roomId,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      comment: attachment.comment,
      createdAt: attachment.createdAt,
      uploadedBy: attachment.uploadedBy,
    };
  }

  async getDownloadPayload(roomId: string, attachmentId: string, userId: string) {
    await this.ensureRoomMember(roomId, userId);

    const attachment = await this.database.roomAttachment.findFirst({
      where: {
        id: attachmentId,
        roomId,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return {
      absolutePath: resolve(UPLOADS_ROOT, attachment.storagePath),
      originalName: attachment.originalName,
    };
  }

  private validateFile(file: UploadFile) {
    if (file.size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const isImage = file.mimetype.startsWith('image/');
    const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;

    if (file.size > maxSize) {
      throw new BadRequestException(
        isImage
          ? 'Image exceeds 3 MB limit'
          : 'File exceeds 20 MB limit',
      );
    }
  }

  private async ensureRoomMember(roomId: string, userId: string) {
    const membership = await this.database.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (membership) {
      return membership;
    }

    const room = await this.database.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    throw new ForbiddenException('Join the room to access attachments');
  }
}
