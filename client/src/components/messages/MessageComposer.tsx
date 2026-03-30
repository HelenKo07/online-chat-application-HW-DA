import { FormEvent, useState } from 'react';

type MessageComposerProps = {
  canSend: boolean;
  isSending: boolean;
  title?: string;
  enabledPlaceholder?: string;
  disabledPlaceholder?: string;
  sendLabel?: string;
  replyTo?: {
    id: string;
    text: string;
    author: {
      username: string;
    };
  } | null;
  onCancelReply?: () => void;
  onSend: (text: string) => Promise<void>;
};

export function MessageComposer({
  canSend,
  isSending,
  title = 'Message',
  enabledPlaceholder = 'Write a message...',
  disabledPlaceholder = 'Messaging is unavailable',
  sendLabel = 'Send message',
  replyTo = null,
  onCancelReply,
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
      {replyTo ? (
        <div className="reply-preview">
          <div className="reply-preview__head">
            <strong>Replying to {replyTo.author.username}</strong>
            {onCancelReply ? (
              <button className="button button--ghost" type="button" onClick={onCancelReply}>
                Cancel reply
              </button>
            ) : null}
          </div>
          <p>{replyTo.text}</p>
        </div>
      ) : null}

      <label className="field">
        <span>{title}</span>
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={canSend ? enabledPlaceholder : disabledPlaceholder}
          disabled={!canSend || isSending}
          maxLength={3072}
        />
      </label>

      <div className="composer-card__actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={!canSend || isSending}
        >
          {isSending ? 'Sending...' : sendLabel}
        </button>
      </div>
    </form>
  );
}
