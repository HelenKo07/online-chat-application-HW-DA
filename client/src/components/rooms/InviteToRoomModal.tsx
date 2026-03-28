import { FormEvent, useEffect, useState } from 'react';

type InviteToRoomModalProps = {
  roomName: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (username: string, message?: string) => Promise<void>;
};

export function InviteToRoomModal({
  roomName,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: InviteToRoomModalProps) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      return;
    }

    await onSubmit(username.trim(), message.trim() || undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Invite to ${roomName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-card__header">
          <h3>Invite to {roomName}</h3>
          <button className="button" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <form className="modal-card__form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="friend_username"
              minLength={3}
              maxLength={24}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span>Message (optional)</span>
            <textarea
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Join our private room"
              maxLength={240}
              disabled={isSubmitting}
            />
          </label>

          <div className="modal-card__actions">
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Send invite'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
