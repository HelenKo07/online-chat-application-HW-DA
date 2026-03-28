import { Room } from '../../types/api';

type RoomListProps = {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
};

export function RoomList({ rooms, selectedRoomId, onSelect }: RoomListProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Public rooms</h3>
        <span className="pill">{rooms.length}</span>
      </div>

      <div className="room-list">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            className={`room-card${selectedRoomId === room.id ? ' room-card--active' : ''}`}
            onClick={() => onSelect(room.id)}
          >
            <div className="room-card__content">
              <strong>{room.name}</strong>
              <small>{room.description}</small>
            </div>
            <div className="room-card__meta">
              <span className="pill">{room.unreadCount > 0 ? room.unreadCount : room.membersCount}</span>
              <small>{room.isMember ? 'Joined' : room.visibility}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
