import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RoomInvitation } from '../types/api';

export function useRoomInvitations(
  enabled: boolean,
  onRoomAccepted?: (roomId: string) => Promise<void> | void,
) {
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = async (options?: { silent?: boolean }) => {
    if (!enabled) {
      setInvitations([]);
      return;
    }

    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await api.getMyRoomInvitations();
      setInvitations(response.invitations);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load invitations');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadInvitations();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadInvitations({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  const acceptInvitation = async (roomId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await api.acceptRoomInvitation(roomId);
      await onRoomAccepted?.(response.room.id);
      await loadInvitations();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to accept invitation');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const declineInvitation = async (roomId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.declineRoomInvitation(roomId);
      await loadInvitations();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to decline invitation');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    invitations,
    isLoading,
    isMutating,
    error,
    loadInvitations,
    acceptInvitation,
    declineInvitation,
  };
}
