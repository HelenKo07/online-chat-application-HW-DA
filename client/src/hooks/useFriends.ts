import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FriendState } from '../types/api';

const emptyState: FriendState = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUsers: [],
};

export function useFriends(enabled: boolean) {
  const [state, setState] = useState<FriendState>(emptyState);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (options?: { silent?: boolean }) => {
    if (!enabled) {
      return;
    }

    const silent = options?.silent ?? false;

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      setState(await api.getFriends());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load friends');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void refresh();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  const sendRequest = async (payload: { username: string; message?: string }) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.sendFriendRequest(payload);
      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Failed to send friend request',
      );
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.acceptFriendRequest(requestId);
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to accept request');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const declineRequest = async (requestId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.declineFriendRequest(requestId);
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to decline request');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const blockUser = async (userId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.blockUser(userId);
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to block user');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const unblockUser = async (userId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.unblockUser(userId);
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to unblock user');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const removeFriend = async (userId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.removeFriend(userId);
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to remove friend');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    ...state,
    isLoading,
    isMutating,
    error,
    refresh,
    sendRequest,
    acceptRequest,
    declineRequest,
    blockUser,
    unblockUser,
    removeFriend,
  };
}
