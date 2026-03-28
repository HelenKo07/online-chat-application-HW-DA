import { DirectChatSummary, Friend, DirectMessage } from '../../types/api';
import { MessageComposer } from '../messages/MessageComposer';

type DirectChatPanelProps = {
  chats: DirectChatSummary[];
  selectedFriend: Friend | { id: string; username: string } | null;
  messages: DirectMessage[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  onSelectFriend: (friendId: string) => void;
  onSendMessage: (text: string) => Promise<void>;
};

export function DirectChatPanel({
  chats,
  selectedFriend,
  messages,
  isLoadingChats,
  isLoadingMessages,
  isSending,
  onSelectFriend,
  onSendMessage,
}: DirectChatPanelProps) {
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
                      <time>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p>{message.text}</p>
                  </article>
                ))
              )
            ) : (
              <p className="muted-copy">Pick a friend to open a direct chat.</p>
            )}
          </div>

          <MessageComposer
            canSend={Boolean(selectedFriend)}
            isSending={isSending}
            onSend={onSendMessage}
          />
        </div>
      </div>
    </section>
  );
}
