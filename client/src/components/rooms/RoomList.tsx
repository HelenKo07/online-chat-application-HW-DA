import { useDeferredValue, useState } from 'react';
import { Room } from '../../types/api';

type RoomListProps = {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
};

export function RoomList({ rooms, selectedRoomId, onSelect }: RoomListProps) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredRooms = deferredSearch
    ? rooms.filter((room) => {
        const byName = room.name.toLowerCase().includes(deferredSearch);
        const byDescription = room.description.toLowerCase().includes(deferredSearch);
        return byName || byDescription;
      })
    : rooms;

  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Public rooms</h3>
        <span className="pill">{filteredRooms.length}</span>
      </div>

      <label className="field room-list__search">
        <span>Search</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Room name or description"
          maxLength={120}
        />
      </label>

      <div className="room-list">
        {filteredRooms.length === 0 ? (
          <p className="muted-copy">No rooms match your search.</p>
        ) : (
          filteredRooms.map((room) => (
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
          ))
        )}
      </div>
    </section>
  );
}
