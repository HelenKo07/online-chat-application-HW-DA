import { FormEvent, useState } from 'react';

type MessageComposerProps = {
  canSend: boolean;
  isSending: boolean;
  onSend: (text: string) => Promise<void>;
};

export function MessageComposer({
  canSend,
  isSending,
  onSend,
}: MessageComposerProps) {
  const [text, setText] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    await onSend(text);
    setText('');
  };

  return (
    <form className="composer-card" onSubmit={handleSubmit}>
      <label className="field">
        <span>Room message</span>
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            canSend
              ? 'Write a message to this room...'
              : 'Join the room to start messaging'
          }
          disabled={!canSend || isSending}
          maxLength={3072}
        />
      </label>

      <div className="composer-card__actions">
        <small>Stage 4: room messages persisted in PostgreSQL</small>
        <button
          className="button button--primary"
          type="submit"
          disabled={!canSend || isSending}
        >
          {isSending ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
