import { Friend, FriendRequest } from '../../types/api';

type FriendsPanelProps = {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isMutating: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
};

export function FriendsPanel({
  friends,
  incomingRequests,
  outgoingRequests,
  isMutating,
  onAccept,
  onDecline,
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
          <button
            key={friend.id}
            type="button"
            className={`friend-card${selectedFriendId === friend.id ? ' friend-card--active' : ''}`}
            onClick={() => onSelectFriend(friend.id)}
          >
            <strong>{friend.username}</strong>
            <small>{friend.presence} · friend since {new Date(friend.since).toLocaleDateString()}</small>
          </button>
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
    </section>
  );
}
