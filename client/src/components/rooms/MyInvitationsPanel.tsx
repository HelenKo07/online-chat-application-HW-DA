import { RoomInvitation } from '../../types/api';

type MyInvitationsPanelProps = {
  invitations: RoomInvitation[];
  isLoading: boolean;
  isMutating: boolean;
  onAccept: (roomId: string) => Promise<void>;
  onDecline: (roomId: string) => Promise<void>;
};

export function MyInvitationsPanel({
  invitations,
  isLoading,
  isMutating,
  onAccept,
  onDecline,
}: MyInvitationsPanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Private invites</h3>
        <span className="pill">{invitations.length}</span>
      </div>

      {isLoading ? (
        <p className="muted-copy">Loading invitations...</p>
      ) : invitations.length === 0 ? (
        <p className="muted-copy">No pending private room invitations.</p>
      ) : (
        <div className="request-group">
          {invitations.map((invitation) => (
            <article key={invitation.id} className="request-card">
              <strong>{invitation.room.name}</strong>
              <small>
                from {invitation.invitedBy.username} · {invitation.room.visibility.toLowerCase()}
              </small>
              {invitation.message ? <p>{invitation.message}</p> : null}
              <div className="request-card__actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void onAccept(invitation.room.id)}
                  disabled={isMutating}
                >
                  Accept
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => void onDecline(invitation.room.id)}
                  disabled={isMutating}
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
