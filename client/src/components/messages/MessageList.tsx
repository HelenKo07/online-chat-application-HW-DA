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
  isEditing: boolean;
  hasMore: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onEditMessage: (messageId: string, text: string) => Promise<void>;
};

export function MessageList({
  messages,
  isLoading,
  roomName,
  isMember,
  canModerate,
  isDeleting,
  isEditing,
  hasMore,
  isLoadingOlder,
  onLoadOlder,
  onDeleteMessage,
  onEditMessage,
}: MessageListProps) {
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState<{
    id: string;
    author: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);

  const isEdited = (message: RoomMessage) =>
    new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime();

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
      {hasMore ? (
        <div className="message-panel__older">
          <button
            className="button"
            type="button"
            onClick={() => void onLoadOlder()}
            disabled={isLoadingOlder}
          >
            {isLoadingOlder ? 'Loading older...' : 'Load older messages'}
          </button>
        </div>
      ) : null}

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
                  {isEdited(message) ? <span className="message__edited">edited</span> : null}
                  {message.isOwn ? (
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() =>
                        setEditingMessage({
                          id: message.id,
                          text: message.text,
                        })
                      }
                      disabled={isEditing || isDeleting}
                    >
                      Edit
                    </button>
                  ) : null}
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
              {editingMessage?.id === message.id ? (
                <form
                  className="message__edit-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!editingMessage.text.trim()) {
                      return;
                    }
                    await onEditMessage(message.id, editingMessage.text);
                    setEditingMessage(null);
                  }}
                >
                  <textarea
                    value={editingMessage.text}
                    onChange={(event) =>
                      setEditingMessage((current) =>
                        current ? { ...current, text: event.target.value } : current,
                      )
                    }
                    maxLength={3072}
                    rows={3}
                  />
                  <div className="request-card__actions">
                    <button
                      className="button button--primary"
                      type="submit"
                      disabled={isEditing || !editingMessage.text.trim()}
                    >
                      {isEditing ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="button"
                      type="button"
                      onClick={() => setEditingMessage(null)}
                      disabled={isEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p>{message.text}</p>
              )}
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
