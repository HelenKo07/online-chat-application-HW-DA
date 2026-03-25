type Presence = 'online' | 'afk' | 'offline';

type Room = {
  id: string;
  name: string;
  unread: number;
  members: number;
  active?: boolean;
};

type Contact = {
  id: string;
  name: string;
  presence: Presence;
  unread: number;
};

type Message = {
  id: string;
  author: string;
  text: string;
  time: string;
  own?: boolean;
};

const rooms: Room[] = [
  { id: 'general', name: 'General', unread: 3, members: 128, active: true },
  { id: 'frontend', name: 'Frontend', unread: 0, members: 34 },
  { id: 'backend', name: 'Backend', unread: 12, members: 21 },
  { id: 'design', name: 'Design', unread: 0, members: 16 },
];

const contacts: Contact[] = [
  { id: 'mila', name: 'Mila', presence: 'online', unread: 2 },
  { id: 'den', name: 'Den', presence: 'afk', unread: 0 },
  { id: 'rita', name: 'Rita', presence: 'offline', unread: 0 },
];

const messages: Message[] = [
  {
    id: 'm1',
    author: 'Mila',
    text: 'Welcome to the foundation stage. Next we will connect the UI to the API and database.',
    time: '09:12',
  },
  {
    id: 'm2',
    author: 'You',
    text: 'Great. The first goal is a clean architecture with rooms, contacts and a classic chat layout.',
    time: '09:13',
    own: true,
  },
  {
    id: 'm3',
    author: 'System',
    text: 'Current stage: layout, project structure, Docker setup, and NestJS server skeleton.',
    time: '09:14',
  },
];

const presenceLabel: Record<Presence, string> = {
  online: 'Online',
  afk: 'AFK',
  offline: 'Offline',
};

export default function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">OC</div>
          <div>
            <p className="eyebrow">Stage 1 foundation</p>
            <h1>Online Chat</h1>
          </div>
        </div>

        <section className="panel">
          <div className="panel__header">
            <h2>Rooms</h2>
            <button type="button">New room</button>
          </div>
          <div className="panel__list">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`room-card${room.active ? ' room-card--active' : ''}`}
              >
                <span>
                  <strong>{room.name}</strong>
                  <small>{room.members} members</small>
                </span>
                {room.unread > 0 ? <em>{room.unread}</em> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Contacts</h2>
            <button type="button">Add friend</button>
          </div>
          <div className="panel__list">
            {contacts.map((contact) => (
              <button key={contact.id} type="button" className="contact-card">
                <span>
                  <strong>{contact.name}</strong>
                  <small>{presenceLabel[contact.presence]}</small>
                </span>
                <span className={`presence presence--${contact.presence}`}>
                  {contact.unread > 0 ? <em>{contact.unread}</em> : null}
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Public room</p>
            <h2>General</h2>
          </div>
          <div className="topbar__actions">
            <button type="button">Search</button>
            <button type="button">Invite</button>
            <button type="button" className="button--primary">
              Profile
            </button>
          </div>
        </header>

        <section className="chat-view">
          <div className="chat-view__messages">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`message${message.own ? ' message--own' : ''}`}
              >
                <div className="message__meta">
                  <strong>{message.author}</strong>
                  <time>{message.time}</time>
                </div>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <form className="composer">
            <label className="composer__reply">Replying is planned for the next stage</label>
            <textarea
              rows={3}
              placeholder="Write a message, paste an image, or attach a file..."
            />
            <div className="composer__actions">
              <div className="composer__tools">
                <button type="button">Emoji</button>
                <button type="button">Attach</button>
              </div>
              <button type="submit" className="button--primary">
                Send
              </button>
            </div>
          </form>
        </section>
      </main>

      <aside className="members">
        <div className="members__header">
          <p className="eyebrow">Room members</p>
          <h2>128 people</h2>
        </div>

        <div className="members__list">
          {[
            ['Alyona', 'owner', 'online'],
            ['Mila', 'admin', 'online'],
            ['Den', 'member', 'afk'],
            ['Rita', 'member', 'offline'],
          ].map(([name, role, presence]) => (
            <div key={name} className="member-card">
              <div>
                <strong>{name}</strong>
                <small>{role}</small>
              </div>
              <span className={`presence presence--${presence as Presence}`} />
            </div>
          ))}
        </div>

        <section className="foundation-card">
          <p className="eyebrow">Architecture</p>
          <ul>
            <li>Client: React + TypeScript + Vite</li>
            <li>Server: NestJS REST API</li>
            <li>Next: PostgreSQL, Prisma, Socket.IO</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
