import { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { Room } from '../../types/api';

type RoomStageProps = {
  room: Room | null;
  isMutating: boolean;
  onJoin: (roomId: string) => Promise<void>;
  onLeave: (roomId: string) => Promise<void>;
  onDeleteRoom: () => Promise<void>;
  onOpenInviteModal: () => void;
};

export function RoomStage({
  room,
  isMutating,
  onJoin,
  onLeave,
  onDeleteRoom,
  onOpenInviteModal,
}: RoomStageProps) {
  const [isDeleteRoomConfirmOpen, setIsDeleteRoomConfirmOpen] = useState(false);

  if (!room) {
    return (
      <section className="room-stage room-stage--empty">
        <p className="eyebrow">Rooms</p>
        <h3>Select a room to inspect it</h3>
        <p>
          Stage 3 focuses on creating rooms, browsing the catalog, and joining or
          leaving them with proper ownership rules.
        </p>
      </section>
    );
  }

  const canLeave = room.isMember && room.currentUserRole !== 'OWNER';
  const isOwner = room.currentUserRole === 'OWNER';
  const canInviteToPrivate = room.isMember && room.visibility === 'PRIVATE';
  const canModerate = room.currentUserRole === 'OWNER' || room.currentUserRole === 'ADMIN';

  return (
    <section className="room-stage">
      <div className="room-stage__hero">
        <div>
          <p className="eyebrow">{room.visibility.toLowerCase()} room</p>
          <h3>{room.name}</h3>
          <p>{room.description}</p>
        </div>

        <div className="room-stage__actions">
          {room.isMember ? (
            <>
              {canInviteToPrivate ? (
                <button
                  className="button"
                  type="button"
                  onClick={onOpenInviteModal}
                  disabled={isMutating}
                >
                  Invite user
                </button>
              ) : null}

              <button
                className="button"
                type="button"
                onClick={() => void onLeave(room.id)}
                disabled={isMutating || !canLeave}
              >
                {isOwner ? 'Owner cannot leave' : 'Leave room'}
              </button>

              {isOwner ? (
                <button
                  className="button button--danger"
                  type="button"
                  onClick={() => setIsDeleteRoomConfirmOpen(true)}
                  disabled={isMutating}
                >
                  Delete room
                </button>
              ) : null}
            </>
          ) : (
            <button
              className="button button--primary"
              type="button"
              onClick={() => void onJoin(room.id)}
              disabled={isMutating}
            >
              {isMutating ? 'Joining...' : 'Join room'}
            </button>
          )}
        </div>
      </div>

      <div className="room-stage__grid">
        <article className="info-card">
          <p className="eyebrow">Overview</p>
          <ul className="info-list">
            <li>Owner: {room.owner.username}</li>
            <li>Members: {room.membersCount}</li>
            <li>Your role: {room.currentUserRole ?? 'Visitor'}</li>
          </ul>
        </article>

        <article className="info-card">
          <p className="eyebrow">Moderation</p>
          <ul className="info-list">
            <li>Owner/admin can remove and ban members</li>
            <li>Owner can promote and demote admins</li>
            <li>Private room invitations are available from this stage</li>
            <li>Your moderation access: {canModerate ? 'enabled' : 'read-only'}</li>
          </ul>
        </article>
      </div>

      <ConfirmModal
        isOpen={isDeleteRoomConfirmOpen}
        title={`Delete ${room.name}?`}
        description="This action permanently removes the room and its message history."
        confirmLabel="Delete room"
        isSubmitting={isMutating}
        onCancel={() => setIsDeleteRoomConfirmOpen(false)}
        onConfirm={async () => {
          await onDeleteRoom();
          setIsDeleteRoomConfirmOpen(false);
        }}
      />
    </section>
  );
}
