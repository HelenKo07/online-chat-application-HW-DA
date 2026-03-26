import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RoomMessage } from '../types/api';

export function useRoomMessages(roomId: string | null, enabled: boolean) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) {
      setMessages([]);
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getRoomMessages(roomId);
        setMessages(response.messages);
      } catch (caughtError) {
        setMessages([]);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [roomId, enabled]);

  const sendMessage = async (text: string) => {
    if (!roomId) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.sendRoomMessage(roomId, { text });
      setMessages((current) => [...current, response.message]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send message');
      throw caughtError;
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
  };
}
