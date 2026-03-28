import { FormEvent, useEffect, useState } from 'react';
import { ActiveSession } from '../../types/api';

type AccountPanelProps = {
  sessions: ActiveSession[];
  defaultResetEmail: string;
  isLoadingSessions: boolean;
  isMutating: boolean;
  notice: string | null;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onResetPassword: (email: string, newPassword: string) => Promise<void>;
  onDeleteAccount: (currentPassword: string) => Promise<void>;
};

export function AccountPanel({
  sessions,
  defaultResetEmail,
  isLoadingSessions,
  isMutating,
  notice,
  onRevokeSession,
  onChangePassword,
  onResetPassword,
  onDeleteAccount,
}: AccountPanelProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState(defaultResetEmail);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    setResetEmail(defaultResetEmail);
  }, [defaultResetEmail]);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onChangePassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onResetPassword(resetEmail, resetPasswordValue);
    setResetPasswordValue('');
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onDeleteAccount(deletePassword);
    setDeletePassword('');
  };

  return (
    <section className="panel account-panel">
      <div className="panel__header">
        <h3>Account</h3>
        <span className="pill">{sessions.length}</span>
      </div>

      {notice ? <p className="muted-copy">{notice}</p> : null}

      <div className="account-panel__block">
        <p className="eyebrow">Active sessions</p>
        {isLoadingSessions ? (
          <p className="muted-copy">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="muted-copy">No active sessions.</p>
        ) : (
          <div className="request-group">
            {sessions.map((session) => (
              <article key={session.id} className="request-card">
                <strong>{session.isCurrent ? 'Current session' : 'Active session'}</strong>
                <small>{session.ipAddress || 'Unknown IP'}</small>
                <small>{session.userAgent || 'Unknown browser'}</small>
                {!session.isCurrent ? (
                  <div className="request-card__actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() => void onRevokeSession(session.id)}
                      disabled={isMutating}
                    >
                      Revoke
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      <form className="account-panel__block" onSubmit={handleChangePassword}>
        <p className="eyebrow">Change password</p>
        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={isMutating}
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={isMutating}
          />
        </label>
        <button className="button" type="submit" disabled={isMutating}>
          Update password
        </button>
      </form>

      <form className="account-panel__block" onSubmit={handleResetPassword}>
        <p className="eyebrow">Reset password</p>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            required
            disabled={isMutating}
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={resetPasswordValue}
            onChange={(event) => setResetPasswordValue(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={isMutating}
          />
        </label>
        <button className="button" type="submit" disabled={isMutating}>
          Reset password
        </button>
      </form>

      <form className="account-panel__block account-panel__block--danger" onSubmit={handleDeleteAccount}>
        <p className="eyebrow">Delete account</p>
        <label className="field">
          <span>Confirm password</span>
          <input
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={isMutating}
          />
        </label>
        <button className="button button--danger" type="submit" disabled={isMutating}>
          Delete account
        </button>
      </form>
    </section>
  );
}
