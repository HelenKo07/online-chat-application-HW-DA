import { FormEvent, useState } from 'react';
import { AuthFormState, AuthMode } from '../../types/api';

type AuthFormProps = {
  mode: AuthMode;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: AuthFormState) => Promise<void>;
};

const initialState: AuthFormState = {
  email: '',
  username: '',
  password: '',
};

export function AuthForm({ mode, isSubmitting, error, onSubmit }: AuthFormProps) {
  const [form, setForm] = useState<AuthFormState>(initialState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="auth-card__form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="you@example.com"
          required
        />
      </label>

      {mode === 'register' ? (
        <label className="field">
          <span>Username</span>
          <input
            type="text"
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            placeholder="alyona_dev"
            minLength={3}
            maxLength={24}
            required
          />
        </label>
      ) : null}

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}
