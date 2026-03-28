import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CreateRoomState, Room } from '../types/api';

export function useRooms(enabled: boolean) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async (preferredRoomId?: string) => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getRooms();
      setRooms(response.rooms);

      const nextSelected =
        preferredRoomId ??
        selectedRoomId ??
        response.rooms.find((room) => room.isMember)?.id ??
        response.rooms[0]?.id ??
        null;

      setSelectedRoomId(nextSelected);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRooms();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadRooms();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled, selectedRoomId]);

  const createRoom = async (payload: CreateRoomState) => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await api.createRoom(payload);
      await loadRooms(response.room.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to create room');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.joinRoom(roomId);
      await loadRooms(roomId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to join room');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const leaveRoom = async (roomId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.leaveRoom(roomId);
      await loadRooms();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to leave room');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const selectedRoom: Room | null =
    rooms.find((room) => room.id === selectedRoomId) ?? null;

  return {
    rooms,
    selectedRoom,
    selectedRoomId,
    setSelectedRoomId,
    isLoading,
    isMutating,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    refreshRooms: loadRooms,
  };
}
