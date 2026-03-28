import { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { RoomMessage } from '../../types/api';

type MessageListProps = {
  messages: RoomMessage[];
  isLoading: boolean;
  roomName: string | null;
  isMember: boolean;
  canModerate: boolean;
  isDeleting: boolean;
  onDeleteMessage: (messageId: string) => Promise<void>;
};

export function MessageList({
  messages,
  isLoading,
  roomName,
  isMember,
  canModerate,
  isDeleting,
  onDeleteMessage,
}: MessageListProps) {
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState<{
    id: string;
    author: string;
  } | null>(null);

  if (!roomName) {
    return (
      <section className="message-panel message-panel--empty">
        <p className="eyebrow">Messages</p>
        <h3>Select a room to open its history</h3>
      </section>
    );
  }

  if (!isMember) {
    return (
      <section className="message-panel message-panel--empty">
        <p className="eyebrow">Messages</p>
        <h3>Join {roomName} to unlock the conversation</h3>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="message-panel message-panel--empty">
        <p className="eyebrow">Messages</p>
        <h3>Loading room history...</h3>
      </section>
    );
  }

  return (
    <section className="message-panel">
      <div className="message-list">
        {messages.length === 0 ? (
          <article className="message message--system">
            <div className="message__meta">
              <strong>System</strong>
            </div>
            <p>This room is empty. Send the first message to start the conversation.</p>
          </article>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`message${message.isOwn ? ' message--own' : ''}`}
            >
              <div className="message__meta">
                <strong>{message.author.username}</strong>
                <div className="message__meta-actions">
                  <time>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  {message.isOwn || canModerate ? (
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() =>
                        setPendingDeleteMessage({
                          id: message.id,
                          author: message.author.username,
                        })
                      }
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
              <p>{message.text}</p>
            </article>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingDeleteMessage)}
        title={pendingDeleteMessage ? `Delete message by ${pendingDeleteMessage.author}?` : 'Delete message?'}
        description="This message will be permanently removed from room history."
        confirmLabel="Delete message"
        isSubmitting={isDeleting}
        onCancel={() => setPendingDeleteMessage(null)}
        onConfirm={async () => {
          if (!pendingDeleteMessage) {
            return;
          }

          await onDeleteMessage(pendingDeleteMessage.id);
          setPendingDeleteMessage(null);
        }}
      />
    </section>
  );
}
