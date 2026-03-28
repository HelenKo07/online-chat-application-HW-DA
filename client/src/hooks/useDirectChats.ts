import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DirectChatSummary, DirectMessage, Friend } from '../types/api';

export function useDirectChats(enabled: boolean, friends: Friend[]) {
  const [chats, setChats] = useState<DirectChatSummary[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChats = async () => {
    if (!enabled) {
      return;
    }

    setIsLoadingChats(true);
    setError(null);

    try {
      const response = await api.getDirectChats();
      setChats(response.chats);

      if (!selectedFriendId) {
        setSelectedFriendId(response.chats[0]?.friend.id ?? friends[0]?.id ?? null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load direct chats');
    } finally {
      setIsLoadingChats(false);
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
      void refreshChats();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled, selectedFriendId, friends.length]);

  useEffect(() => {
    if (!selectedFriendId || !enabled) {
      setMessages([]);
      return;
    }

    void (async () => {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const response = await api.getDirectMessages(selectedFriendId);
        setMessages(response.messages);
        await refreshChats();
      } catch (caughtError) {
        setMessages([]);
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load direct messages');
      } finally {
        setIsLoadingMessages(false);
      }
    })();
  }, [selectedFriendId, enabled]);

  const sendMessage = async (text: string) => {
    if (!selectedFriendId) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.sendDirectMessage(selectedFriendId, { text });
      setMessages((current) => [...current, response.message]);
      await refreshChats();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send direct message');
      throw caughtError;
    } finally {
      setIsSending(false);
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
    isLoadingChats,
    isLoadingMessages,
    isSending,
    error,
    sendMessage,
    refreshChats,
  };
}
