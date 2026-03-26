import { Room } from '../../types/api';

type MemberPanelProps = {
  room: Room | null;
};

export function MemberPanel({ room }: MemberPanelProps) {
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
              <div>
                <strong>{member.username}</strong>
                <small>{member.role.toLowerCase()}</small>
              </div>
              <span className={`role-badge role-badge--${member.role.toLowerCase()}`}>
                {member.role.toLowerCase()}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="members-empty">Members will appear here after you pick a room.</p>
      )}
    </aside>
  );
}
