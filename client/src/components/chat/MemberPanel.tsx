import { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { Room, RoomBan } from '../../types/api';

type MemberPanelProps = {
  room: Room | null;
  currentUserId: string;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  bans: RoomBan[];
  canModerate: boolean;
  isMutating: boolean;
  isLoadingBans: boolean;
  onPromoteAdmin: (userId: string) => Promise<void>;
  onDemoteAdmin: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onBanUser: (userId: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
};

export function MemberPanel({
  room,
  currentUserId,
  currentUserRole,
  bans,
  canModerate,
  isMutating,
  isLoadingBans,
  onPromoteAdmin,
  onDemoteAdmin,
  onRemoveMember,
  onBanUser,
  onUnbanUser,
}: MemberPanelProps) {
  const [pendingAction, setPendingAction] = useState<{
    type: 'ban' | 'remove' | 'demote' | 'unban';
    userId: string;
    username: string;
  } | null>(null);

  const actorIsOwner = currentUserRole === 'OWNER';
  const actorIsAdmin = currentUserRole === 'ADMIN' || actorIsOwner;

  return (
    <aside className="members-panel">
      <div className="panel__header">
        <h3>Members</h3>
        <span className="pill">{room?.membersCount ?? 0}</span>
      </div>

      {room ? (
        <div className="members-list">
          {room.members.map((member) => (
            <article key={member.id} className="member-card">
              <div className="member-card__main">
                <strong>{member.username}</strong>
                <small>{member.role.toLowerCase()} · {member.presence}</small>
              </div>
              <div className="member-card__meta">
                <span className={`presence-dot presence-dot--${member.presence}`} />
                <span className={`role-badge role-badge--${member.role.toLowerCase()}`}>
                  {member.role.toLowerCase()}
                </span>
              </div>
              {canModerate &&
              member.id !== currentUserId &&
              member.role !== 'OWNER' ? (
                <div className="member-card__actions">
                  {actorIsOwner && member.role === 'MEMBER' ? (
                    <button
                      className="button"
                      type="button"
                      onClick={() => void onPromoteAdmin(member.id)}
                      disabled={isMutating}
                    >
                      Promote admin
                    </button>
                  ) : null}

                  {member.role === 'ADMIN' ? (
                    <button
                      className="button"
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          type: 'demote',
                          userId: member.id,
                          username: member.username,
                        })
                      }
                      disabled={isMutating}
                    >
                      Demote
                    </button>
                  ) : null}

                  {(actorIsOwner || (actorIsAdmin && member.role === 'MEMBER')) ? (
                    <>
                      <button
                        className="button"
                        type="button"
                        onClick={() =>
                          setPendingAction({
                            type: 'remove',
                            userId: member.id,
                            username: member.username,
                          })
                        }
                        disabled={isMutating}
                      >
                        Remove
                      </button>

                      <button
                        className="button button--danger"
                        type="button"
                        onClick={() =>
                          setPendingAction({
                            type: 'ban',
                            userId: member.id,
                            username: member.username,
                          })
                        }
                        disabled={isMutating}
                      >
                        Ban
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="members-empty">Members will appear here after you pick a room.</p>
      )}

      {room && canModerate ? (
        <section className="bans-panel">
          <div className="panel__header">
            <h3>Banned users</h3>
            <span className="pill">{bans.length}</span>
          </div>

          {isLoadingBans ? (
            <p className="muted-copy">Loading bans...</p>
          ) : bans.length === 0 ? (
            <p className="muted-copy">No banned users in this room.</p>
          ) : (
            <div className="request-group">
              {bans.map((ban) => (
                <article key={ban.id} className="request-card">
                  <strong>{ban.user.username}</strong>
                  <small>banned by {ban.bannedBy.username}</small>
                  {ban.reason ? <p>{ban.reason}</p> : null}
                  <div className="request-card__actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          type: 'unban',
                          userId: ban.user.id,
                          username: ban.user.username,
                        })
                      }
                      disabled={isMutating}
                    >
                      Unban
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(pendingAction)}
        title={
          pendingAction
            ? `${toActionTitle(pendingAction.type)} ${pendingAction.username}?`
            : 'Confirm action'
        }
        description={pendingAction ? toActionDescription(pendingAction.type) : ''}
        confirmLabel={pendingAction ? toActionLabel(pendingAction.type) : 'Confirm'}
        isSubmitting={isMutating}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) {
            return;
          }

          if (pendingAction.type === 'ban') {
            await onBanUser(pendingAction.userId);
          } else if (pendingAction.type === 'remove') {
            await onRemoveMember(pendingAction.userId);
          } else if (pendingAction.type === 'demote') {
            await onDemoteAdmin(pendingAction.userId);
          } else if (pendingAction.type === 'unban') {
            await onUnbanUser(pendingAction.userId);
          }

          setPendingAction(null);
        }}
      />
    </aside>
  );
}

function toActionTitle(action: 'ban' | 'remove' | 'demote' | 'unban') {
  if (action === 'ban') {
    return 'Ban';
  }

  if (action === 'remove') {
    return 'Remove';
  }

  if (action === 'demote') {
    return 'Demote';
  }

  return 'Unban';
}

function toActionLabel(action: 'ban' | 'remove' | 'demote' | 'unban') {
  if (action === 'ban') {
    return 'Ban user';
  }

  if (action === 'remove') {
    return 'Remove user';
  }

  if (action === 'demote') {
    return 'Demote admin';
  }

  return 'Unban user';
}

function toActionDescription(action: 'ban' | 'remove' | 'demote' | 'unban') {
  if (action === 'ban') {
    return 'This user will be removed and blocked from rejoining until unbanned.';
  }

  if (action === 'remove') {
    return 'This user will be removed from the room and treated as banned.';
  }

  if (action === 'demote') {
    return 'This admin will lose admin privileges and become a regular member.';
  }

  return 'This user will be removed from the room ban list and can join again.';
}
