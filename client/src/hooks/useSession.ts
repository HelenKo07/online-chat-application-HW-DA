import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthMode, AuthUser } from '../types/api';

type AuthPayload = {
  email: string;
  username?: string;
  password: string;
};

export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.me();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const authenticate = async (mode: AuthMode, payload: AuthPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response =
        mode === 'register'
          ? await api.register({
              email: payload.email,
              username: payload.username ?? '',
              password: payload.password,
            })
          : await api.login({
              email: payload.email,
              password: payload.password,
            });

      setUser(response.user);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed');
      throw caughtError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.logout();
      setUser(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Logout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSession = () => {
    setUser(null);
  };

  return {
    user,
    isLoading,
    isSubmitting,
    error,
    authenticate,
    logout,
    clearSession,
  };
}
