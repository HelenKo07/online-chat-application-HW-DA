import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RoomMessage } from '../types/api';

export function useRoomMessages(
  roomId: string | null,
  enabled: boolean,
  onMessagesRead?: () => Promise<void> | void,
) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) {
      setMessages([]);
      setNextCursor(null);
      setHasMore(false);
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getRoomMessages(roomId, { limit: 30 });
        setMessages(response.messages);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        await onMessagesRead?.();
      } catch (caughtError) {
        setMessages([]);
        setNextCursor(null);
        setHasMore(false);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [roomId, enabled]);

  const sendMessage = async (text: string, replyToMessageId?: string) => {
    if (!roomId) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.sendRoomMessage(roomId, { text, replyToMessageId });
      setMessages((current) => [...current, response.message]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send message');
      throw caughtError;
    } finally {
      setIsSending(false);
    }
  };

  const loadOlder = async () => {
    if (!roomId || !enabled || !hasMore || !nextCursor) {
      return;
    }

    setIsLoadingOlder(true);
    setError(null);

    try {
      const response = await api.getRoomMessages(roomId, {
        before: nextCursor,
        limit: 30,
      });

      setMessages((current) => [...response.messages, ...current]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load older messages');
      throw caughtError;
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!roomId) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteRoomMessage(roomId, messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete message');
      throw caughtError;
    } finally {
      setIsDeleting(false);
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    if (!roomId) {
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      const response = await api.editRoomMessage(roomId, messageId, { text });
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? response.message : message,
        ),
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to edit message');
      throw caughtError;
    } finally {
      setIsEditing(false);
    }
  };

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasMore,
    isSending,
    isDeleting,
    isEditing,
    error,
    sendMessage,
    loadOlder,
    deleteMessage,
    editMessage,
  };
}
