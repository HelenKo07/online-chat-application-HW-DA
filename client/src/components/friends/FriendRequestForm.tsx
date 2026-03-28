import { FormEvent, useState } from 'react';

type FriendRequestFormProps = {
  onSubmit: (payload: { username: string; message?: string }) => Promise<void>;
  isSubmitting: boolean;
};

export function FriendRequestForm({
  onSubmit,
  isSubmitting,
}: FriendRequestFormProps) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      username,
      message: message.trim() || undefined,
    });
    setUsername('');
    setMessage('');
  };

  return (
    <form className="panel friend-form" onSubmit={handleSubmit}>
      <div className="panel__header">
        <h3>Add friend</h3>
        <span className="pill">DM</span>
      </div>

      <label className="field">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="rooms_member"
          required
        />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Want to chat?"
          maxLength={240}
        />
      </label>

      <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send request'}
      </button>
    </form>
  );
}
