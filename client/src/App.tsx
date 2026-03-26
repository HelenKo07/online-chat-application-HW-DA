import { AuthScreen } from './components/auth/AuthScreen';
import { RoomStage } from './components/chat/RoomStage';
import { MemberPanel } from './components/chat/MemberPanel';
import { AppHeader } from './components/layout/AppHeader';
import { MessageComposer } from './components/messages/MessageComposer';
import { MessageList } from './components/messages/MessageList';
import { CreateRoomForm } from './components/rooms/CreateRoomForm';
import { RoomList } from './components/rooms/RoomList';
import { useRoomMessages } from './hooks/useRoomMessages';
import { useRooms } from './hooks/useRooms';
import { useSession } from './hooks/useSession';

export default function App() {
  const session = useSession();
  const rooms = useRooms(Boolean(session.user));
  const roomMessages = useRoomMessages(
    rooms.selectedRoom?.id ?? null,
    Boolean(session.user && rooms.selectedRoom?.isMember),
  );

  if (session.isLoading) {
    return (
      <section className="loading-screen">
        <div className="loading-card">
          <p className="eyebrow">Booting app</p>
          <h1>Loading your chat workspace</h1>
        </div>
      </section>
    );
  }

  if (!session.user) {
    return (
      <AuthScreen
        isSubmitting={session.isSubmitting}
        error={session.error}
        onAuthenticate={session.authenticate}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppHeader
        user={session.user}
        room={rooms.selectedRoom}
        onLogout={session.logout}
        isSubmitting={session.isSubmitting}
      />

      <div className="dashboard-grid">
        <aside className="sidebar">
          <div className="brand-card">
            <p className="eyebrow">Classic layout</p>
            <h1>Chattrix</h1>
            <p>
              Public room catalog, membership controls, and a clean structure for
              the next stages.
            </p>
          </div>

          <CreateRoomForm onSubmit={rooms.createRoom} isSubmitting={rooms.isMutating} />
          <RoomList
            rooms={rooms.rooms}
            selectedRoomId={rooms.selectedRoomId}
            onSelect={rooms.setSelectedRoomId}
          />
        </aside>

        <main className="workspace">
          {rooms.error ? <p className="form-error workspace__error">{rooms.error}</p> : null}
          {roomMessages.error ? (
            <p className="form-error workspace__error">{roomMessages.error}</p>
          ) : null}
          {rooms.isLoading ? (
            <section className="room-stage room-stage--empty">
              <p className="eyebrow">Rooms</p>
              <h3>Loading room catalog...</h3>
            </section>
          ) : (
            <div className="workspace__stack">
              <RoomStage
                room={rooms.selectedRoom}
                isMutating={rooms.isMutating}
                onJoin={rooms.joinRoom}
                onLeave={rooms.leaveRoom}
              />
              <MessageList
                messages={roomMessages.messages}
                isLoading={roomMessages.isLoading}
                roomName={rooms.selectedRoom?.name ?? null}
                isMember={Boolean(rooms.selectedRoom?.isMember)}
              />
              <MessageComposer
                canSend={Boolean(rooms.selectedRoom?.isMember)}
                isSending={roomMessages.isSending}
                onSend={roomMessages.sendMessage}
              />
            </div>
          )}
        </main>

        <MemberPanel room={rooms.selectedRoom} />
      </div>
    </div>
  );
}
