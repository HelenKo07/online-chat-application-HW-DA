import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Room, RoomBan } from '../types/api';

type UseRoomModerationArgs = {
  room: Room | null;
  enabled: boolean;
  refreshRooms: (preferredRoomId?: string) => Promise<void>;
  selectRoom: (roomId: string | null) => void;
};

export function useRoomModeration({
  room,
  enabled,
  refreshRooms,
  selectRoom,
}: UseRoomModerationArgs) {
  const [bans, setBans] = useState<RoomBan[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [isLoadingBans, setIsLoadingBans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canModerate = Boolean(
    room && room.isMember && (room.currentUserRole === 'OWNER' || room.currentUserRole === 'ADMIN'),
  );
  const isOwner = room?.currentUserRole === 'OWNER';

  const loadBans = async () => {
    if (!enabled || !room?.id || !canModerate) {
      setBans([]);
      return;
    }

    setIsLoadingBans(true);

    try {
      const response = await api.getRoomBans(room.id);
      setBans(response.bans);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load bans');
    } finally {
      setIsLoadingBans(false);
    }
  };

  useEffect(() => {
    void loadBans();
  }, [enabled, room?.id, canModerate]);

  const mutate = async (
    action: () => Promise<void>,
    preferredRoomId: string | null | undefined = room?.id,
  ) => {
    setIsMutating(true);
    setError(null);

    try {
      await action();
      await refreshRooms(preferredRoomId ?? undefined);
      await loadBans();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Moderation action failed');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const promoteAdmin = async (targetUserId: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.promoteAdmin(room.id, targetUserId);
    });
  };

  const demoteAdmin = async (targetUserId: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.demoteAdmin(room.id, targetUserId);
    });
  };

  const removeMember = async (targetUserId: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.removeMember(room.id, targetUserId);
    });
  };

  const banUser = async (targetUserId: string, reason?: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.banRoomUser(room.id, { userId: targetUserId, reason });
    });
  };

  const unbanUser = async (targetUserId: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.unbanRoomUser(room.id, targetUserId);
    });
  };

  const inviteToPrivateRoom = async (username: string, message?: string) => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.inviteToRoom(room.id, { username, message });
    });
  };

  const deleteRoom = async () => {
    if (!room) {
      return;
    }

    await mutate(async () => {
      await api.deleteRoom(room.id);
      selectRoom(null);
    }, null);
  };

  return {
    bans,
    canModerate,
    isOwner,
    isMutating,
    isLoadingBans,
    error,
    loadBans,
    promoteAdmin,
    demoteAdmin,
    removeMember,
    banUser,
    unbanUser,
    inviteToPrivateRoom,
    deleteRoom,
  };
}
