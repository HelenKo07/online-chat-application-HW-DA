import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RoomAttachment } from '../types/api';

export function useRoomAttachments(roomId: string | null, enabled: boolean) {
  const [attachments, setAttachments] = useState<RoomAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttachments = async () => {
    if (!roomId || !enabled) {
      setAttachments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getRoomAttachments(roomId);
      setAttachments(response.attachments);
    } catch (caughtError) {
      setAttachments([]);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load attachments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAttachments();
  }, [roomId, enabled]);

  const uploadAttachment = async (file: File, comment?: string) => {
    if (!roomId) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await api.uploadRoomAttachment(roomId, { file, comment });
      setAttachments((current) => [...current, response.attachment]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to upload attachment');
      throw caughtError;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    attachments,
    isLoading,
    isUploading,
    error,
    refreshAttachments: loadAttachments,
    uploadAttachment,
  };
}
