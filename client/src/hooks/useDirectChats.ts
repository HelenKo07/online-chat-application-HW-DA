import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DirectChatSummary, DirectMessage, Friend } from '../types/api';

export function useDirectChats(enabled: boolean, friends: Friend[]) {
  const [chats, setChats] = useState<DirectChatSummary[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState<'blocked_by_you' | 'blocked_by_other' | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChats = async (options?: { silent?: boolean }) => {
    if (!enabled) {
      return;
    }

    const silent = options?.silent ?? false;

    if (!silent) {
      setIsLoadingChats(true);
      setError(null);
    }

    try {
      const response = await api.getDirectChats();
      setChats(response.chats);

      if (!selectedFriendId) {
        setSelectedFriendId(response.chats[0]?.friend.id ?? friends[0]?.id ?? null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load direct chats');
    } finally {
      if (!silent) {
        setIsLoadingChats(false);
      }
    }
  };

  useEffect(() => {
    void refreshChats();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshChats({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled, selectedFriendId, friends.length]);

  useEffect(() => {
    if (!selectedFriendId || !enabled) {
      setMessages([]);
      setIsFrozen(false);
      setFreezeReason(null);
      return;
    }

    void (async () => {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const response = await api.getDirectMessages(selectedFriendId);
        setMessages(response.messages);
        setIsFrozen(response.isFrozen);
        setFreezeReason(response.freezeReason);
        await refreshChats({ silent: true });
      } catch (caughtError) {
        setMessages([]);
        setIsFrozen(false);
        setFreezeReason(null);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load direct messages');
      } finally {
        setIsLoadingMessages(false);
      }
    })();
  }, [selectedFriendId, enabled]);

  const sendMessage = async (text: string, replyToMessageId?: string) => {
    if (!selectedFriendId) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.sendDirectMessage(selectedFriendId, {
        text,
        replyToMessageId,
      });
      setMessages((current) => [...current, response.message]);
      await refreshChats({ silent: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send direct message');
      throw caughtError;
    } finally {
      setIsSending(false);
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    if (!selectedFriendId) {
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      const response = await api.editDirectMessage(selectedFriendId, messageId, { text });
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? response.message : message,
        ),
      );
      await refreshChats({ silent: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to edit direct message');
      throw caughtError;
    } finally {
      setIsEditing(false);
    }
  };

  const selectedFriend =
    friends.find((friend) => friend.id === selectedFriendId) ??
    chats.find((chat) => chat.friend.id === selectedFriendId)?.friend ??
    null;

  return {
    chats,
    selectedFriendId,
    setSelectedFriendId,
    selectedFriend,
    messages,
    isFrozen,
    freezeReason,
    isLoadingChats,
    isLoadingMessages,
    isSending,
    isEditing,
    error,
    sendMessage,
    editMessage,
    refreshChats,
  };
}
