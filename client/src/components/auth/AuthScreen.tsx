import { useState } from 'react';
import { AuthMode } from '../../types/api';
import { AuthForm } from './AuthForm';

type AuthScreenProps = {
  isSubmitting: boolean;
  error: string | null;
  onAuthenticate: (
    mode: AuthMode,
    payload: { email: string; username: string; password: string },
  ) => Promise<void>;
};

export function AuthScreen({
  isSubmitting,
  error,
  onAuthenticate,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__hero">
          <h1>Classic web chat with real accounts and public rooms</h1>
        </div>

        <div className="auth-card__tabs">
          <button
            type="button"
            className={`tab-button${mode === 'login' ? ' tab-button--active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`tab-button${mode === 'register' ? ' tab-button--active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <AuthForm
          mode={mode}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={(values) => onAuthenticate(mode, values)}
        />
      </div>
    </section>
  );
}
