import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ActiveSession } from '../types/api';

export function useAccountSettings(enabled: boolean, currentEmail?: string) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!enabled) {
      setSessions([]);
      return;
    }

    setIsLoadingSessions(true);
    setError(null);

    try {
      const response = await api.getSessions();
      setSessions(response.sessions);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [enabled]);

  const revokeSession = async (sessionId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await api.revokeSession(sessionId);
      await loadSessions();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to revoke session');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      await api.changePassword({ currentPassword, newPassword });
      setNotice('Password updated');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to change password');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      await api.resetPassword({ email, newPassword });
      setNotice('Password reset completed');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to reset password');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteAccount = async (currentPassword: string) => {
    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      await api.deleteAccount({ currentPassword });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete account');
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    sessions,
    isLoadingSessions,
    isMutating,
    error,
    notice,
    defaultResetEmail: currentEmail ?? '',
    loadSessions,
    revokeSession,
    changePassword,
    resetPassword,
    deleteAccount,
  };
}
