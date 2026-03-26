import { AuthUser, Room } from '../../types/api';

type AppHeaderProps = {
  user: AuthUser;
  room: Room | null;
  onLogout: () => Promise<void>;
  isSubmitting: boolean;
};

export function AppHeader({ user, room, onLogout, isSubmitting }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{room ? `${room.visibility.toLowerCase()} room` : 'room catalog'}</p>
        <h2>{room ? room.name : 'Choose a room'}</h2>
      </div>

      <div className="topbar__meta">
        <div className="profile-chip">
          <span className="profile-chip__avatar">{user.username.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.username}</strong>
            <small>{user.email}</small>
          </div>
        </div>

        <button className="button" type="button" onClick={() => void onLogout()} disabled={isSubmitting}>
          {isSubmitting ? 'Leaving...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
