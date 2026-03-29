import { BlockedUser, Friend, FriendRequest } from '../../types/api';

type FriendsPanelProps = {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
  isMutating: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onBlockUser: (userId: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
  onRemoveFriend: (userId: string) => Promise<void>;
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
};

export function FriendsPanel({
  friends,
  incomingRequests,
  outgoingRequests,
  blockedUsers,
  isMutating,
  onAccept,
  onDecline,
  onBlockUser,
  onUnblockUser,
  onRemoveFriend,
  onSelectFriend,
  selectedFriendId,
}: FriendsPanelProps) {
  return (
    <section className="panel friends-panel">
      <div className="panel__header">
        <h3>Friends</h3>
        <span className="pill">{friends.length}</span>
      </div>

      <div className="friends-list">
        {friends.map((friend) => (
          <article
            key={friend.id}
            className={`friend-card${selectedFriendId === friend.id ? ' friend-card--active' : ''}`}
          >
            <button
              type="button"
              className="friend-card__select"
              onClick={() => onSelectFriend(friend.id)}
            >
              <strong>{friend.username}</strong>
              <small>{friend.presence} · friend since {new Date(friend.since).toLocaleDateString()}</small>
            </button>
            <div className="request-card__actions">
              <button
                className="button"
                type="button"
                disabled={isMutating}
                onClick={() => void onRemoveFriend(friend.id)}
              >
                Remove
              </button>
              <button
                className="button button--danger"
                type="button"
                disabled={isMutating}
                onClick={() => void onBlockUser(friend.id)}
              >
                Block
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="request-group">
        <p className="eyebrow">Incoming requests</p>
        {incomingRequests.length === 0 ? (
          <p className="muted-copy">No incoming requests yet.</p>
        ) : (
          incomingRequests.map((request) => (
            <article key={request.id} className="request-card">
              <strong>{request.user.username}</strong>
              <small>{request.message || 'No message'}</small>
              <div className="request-card__actions">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={isMutating}
                  onClick={() => void onAccept(request.id)}
                >
                  Accept
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={isMutating}
                  onClick={() => void onDecline(request.id)}
                >
                  Decline
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="request-group">
        <p className="eyebrow">Outgoing requests</p>
        {outgoingRequests.length === 0 ? (
          <p className="muted-copy">No pending outgoing requests.</p>
        ) : (
          outgoingRequests.map((request) => (
            <article key={request.id} className="request-card">
              <strong>{request.user.username}</strong>
              <small>{request.message || 'No message'}</small>
            </article>
          ))
        )}
      </div>

      <div className="request-group">
        <p className="eyebrow">Blocked users</p>
        {blockedUsers.length === 0 ? (
          <p className="muted-copy">No blocked users.</p>
        ) : (
          blockedUsers.map((blocked) => (
            <article key={blocked.id} className="request-card">
              <strong>{blocked.username}</strong>
              <small>blocked {new Date(blocked.blockedAt).toLocaleDateString()}</small>
              <div className="request-card__actions">
                <button
                  className="button"
                  type="button"
                  disabled={isMutating}
                  onClick={() => void onUnblockUser(blocked.id)}
                >
                  Unblock
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
