import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DirectAttachment } from '../types/api';

export function useDirectAttachments(friendId: string | null, enabled: boolean) {
  const [attachments, setAttachments] = useState<DirectAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttachments = async () => {
    if (!friendId || !enabled) {
      setAttachments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getDirectAttachments(friendId);
      setAttachments(response.attachments);
    } catch (caughtError) {
      setAttachments([]);
      setError(
        caughtError instanceof Error ? caughtError.message : 'Failed to load direct attachments',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAttachments();
  }, [friendId, enabled]);

  const uploadAttachment = async (file: File, comment?: string) => {
    if (!friendId) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await api.uploadDirectAttachment(friendId, { file, comment });
      setAttachments((current) => [...current, response.attachment]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Failed to upload direct attachment',
      );
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
