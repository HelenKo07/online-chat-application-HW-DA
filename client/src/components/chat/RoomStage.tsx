import { Room } from '../../types/api';

type RoomStageProps = {
  room: Room | null;
  isMutating: boolean;
  onJoin: (roomId: string) => Promise<void>;
  onLeave: (roomId: string) => Promise<void>;
};

export function RoomStage({ room, isMutating, onJoin, onLeave }: RoomStageProps) {
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
            <button
              className="button"
              type="button"
              onClick={() => void onLeave(room.id)}
              disabled={isMutating || !canLeave}
            >
              {room.currentUserRole === 'OWNER' ? 'Owner cannot leave' : 'Leave room'}
            </button>
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
          <p className="eyebrow">Next chat phase</p>
          <ul className="info-list">
            <li>Connect messages to selected room</li>
            <li>Persist room history in PostgreSQL</li>
            <li>Add invite flows for private rooms</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
