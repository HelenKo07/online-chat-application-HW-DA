import { DirectAttachment, DirectChatSummary, Friend, DirectMessage } from '../../types/api';
import { MessageComposer } from '../messages/MessageComposer';
import { useState } from 'react';
import { AttachmentUploader } from '../attachments/AttachmentUploader';
import { DirectAttachmentList } from './DirectAttachmentList';

type DirectChatPanelProps = {
  chats: DirectChatSummary[];
  selectedFriend: Friend | { id: string; username: string } | null;
  messages: DirectMessage[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isEditing: boolean;
  isFrozen: boolean;
  freezeReason: 'blocked_by_you' | 'blocked_by_other' | null;
  directAttachments: {
    attachments: DirectAttachment[];
    isLoading: boolean;
    isUploading: boolean;
    onUpload: (file: File, comment?: string) => Promise<void>;
  };
  onSelectFriend: (friendId: string) => void;
  onSendMessage: (text: string, replyToMessageId?: string) => Promise<void>;
  onEditMessage: (messageId: string, text: string) => Promise<void>;
};

export function DirectChatPanel({
  chats,
  selectedFriend,
  messages,
  isLoadingChats,
  isLoadingMessages,
  isSending,
  isEditing,
  isFrozen,
  freezeReason,
  directAttachments,
  onSelectFriend,
  onSendMessage,
  onEditMessage,
}: DirectChatPanelProps) {
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    text: string;
    author: { username: string };
  } | null>(null);

  const isEdited = (message: DirectMessage) =>
    new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime();

  return (
    <section className="panel direct-panel">
      <div className="panel__header">
        <h3>Direct chats</h3>
        <span className="pill">{chats.length}</span>
      </div>

      <div className="direct-layout">
        <div className="direct-list">
          {isLoadingChats ? (
            <p className="muted-copy">Loading direct chats...</p>
          ) : chats.length === 0 ? (
            <p className="muted-copy">Accept a friend request to start a direct chat.</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`friend-card${selectedFriend?.id === chat.friend.id ? ' friend-card--active' : ''}`}
                onClick={() => onSelectFriend(chat.friend.id)}
              >
                <strong>{chat.friend.username}</strong>
                <small>
                  {chat.friend.presence ?? 'offline'} · {chat.unreadCount > 0 ? `${chat.unreadCount} unread` : chat.lastMessage?.text || 'No messages yet'}
                </small>
              </button>
            ))
          )}
        </div>

        <div className="direct-thread">
          <div className="direct-thread__header">
            <p className="eyebrow">Direct thread</p>
            <h3>{selectedFriend ? selectedFriend.username : 'Choose a friend'}</h3>
            {isFrozen ? (
              <p className="muted-copy">
                {freezeReason === 'blocked_by_you'
                  ? 'Conversation is frozen because you blocked this user.'
                  : 'Conversation is frozen because this user blocked you.'}
              </p>
            ) : null}
          </div>

          <div className="message-list">
            {selectedFriend ? (
              isLoadingMessages ? (
                <p className="muted-copy">Loading direct messages...</p>
              ) : messages.length === 0 ? (
                <article className="message message--system">
                  <div className="message__meta">
                    <strong>System</strong>
                  </div>
                  <p>Your direct conversation will appear here.</p>
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
                        {isEdited(message) ? (
                          <span className="message__edited">edited</span>
                        ) : null}
                        {message.isOwn && !isFrozen ? (
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() =>
                              setEditingMessage({
                                id: message.id,
                                text: message.text,
                              })
                            }
                            disabled={isEditing}
                          >
                            Edit
                          </button>
                        ) : null}
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={() =>
                            setReplyToMessage({
                              id: message.id,
                              text: message.text,
                              author: { username: message.author.username },
                            })
                          }
                          disabled={isEditing}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    {message.replyTo ? (
                      <blockquote className="reply-reference">
                        <strong>{message.replyTo.author.username}</strong>
                        <p>{message.replyTo.text}</p>
                      </blockquote>
                    ) : null}
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
              )
            ) : (
              <p className="muted-copy">Pick a friend to open a direct chat.</p>
            )}
          </div>

          <MessageComposer
            canSend={Boolean(selectedFriend) && !isFrozen}
            isSending={isSending}
            title="Direct message"
            enabledPlaceholder="Write a direct message..."
            disabledPlaceholder="Direct chat is unavailable"
            replyTo={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            onSend={async (text) => {
              await onSendMessage(text, replyToMessage?.id);
              setReplyToMessage(null);
            }}
          />

          <AttachmentUploader
            canUpload={Boolean(selectedFriend) && !isFrozen}
            isUploading={directAttachments.isUploading}
            onUpload={directAttachments.onUpload}
          />

          <DirectAttachmentList
            friendId={selectedFriend?.id ?? null}
            attachments={directAttachments.attachments}
            isLoading={directAttachments.isLoading}
            canView={Boolean(selectedFriend)}
          />
        </div>
      </div>
    </section>
  );
}
