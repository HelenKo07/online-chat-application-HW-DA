import { AttachmentList } from './components/attachments/AttachmentList';
import { AttachmentUploader } from './components/attachments/AttachmentUploader';
import { AuthScreen } from './components/auth/AuthScreen';
import { RoomStage } from './components/chat/RoomStage';
import { MemberPanel } from './components/chat/MemberPanel';
import { DirectChatPanel } from './components/direct/DirectChatPanel';
import { FriendRequestForm } from './components/friends/FriendRequestForm';
import { FriendsPanel } from './components/friends/FriendsPanel';
import { AppHeader } from './components/layout/AppHeader';
import { MessageComposer } from './components/messages/MessageComposer';
import { MessageList } from './components/messages/MessageList';
import { useDirectChats } from './hooks/useDirectChats';
import { useFriends } from './hooks/useFriends';
import { usePresenceHeartbeat } from './hooks/usePresenceHeartbeat';
import { useRoomAttachments } from './hooks/useRoomAttachments';
import { useRoomInvitations } from './hooks/useRoomInvitations';
import { CreateRoomForm } from './components/rooms/CreateRoomForm';
import { InviteToRoomModal } from './components/rooms/InviteToRoomModal';
import { MyInvitationsPanel } from './components/rooms/MyInvitationsPanel';
import { RoomList } from './components/rooms/RoomList';
import { useRoomModeration } from './hooks/useRoomModeration';
import { useRoomMessages } from './hooks/useRoomMessages';
import { useRooms } from './hooks/useRooms';
import { useSession } from './hooks/useSession';
import { useState } from 'react';

export default function App() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const session = useSession();
  const rooms = useRooms(Boolean(session.user));
  const friends = useFriends(Boolean(session.user));
  const directChats = useDirectChats(Boolean(session.user), friends.friends);
  const roomInvitations = useRoomInvitations(Boolean(session.user), rooms.refreshRooms);
  const roomAttachments = useRoomAttachments(
    rooms.selectedRoom?.id ?? null,
    Boolean(session.user && rooms.selectedRoom?.isMember),
  );
  const roomModeration = useRoomModeration({
    room: rooms.selectedRoom,
    enabled: Boolean(session.user),
    refreshRooms: rooms.refreshRooms,
    selectRoom: rooms.setSelectedRoomId,
  });
  usePresenceHeartbeat(Boolean(session.user));
  const roomMessages = useRoomMessages(
    rooms.selectedRoom?.id ?? null,
    Boolean(session.user && rooms.selectedRoom?.isMember),
    rooms.refreshRooms,
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
          <MyInvitationsPanel
            invitations={roomInvitations.invitations}
            isLoading={roomInvitations.isLoading}
            isMutating={roomInvitations.isMutating}
            onAccept={roomInvitations.acceptInvitation}
            onDecline={roomInvitations.declineInvitation}
          />
          <FriendRequestForm
            onSubmit={friends.sendRequest}
            isSubmitting={friends.isMutating}
          />
        </aside>

        <main className="workspace">
          {rooms.error ? <p className="form-error workspace__error">{rooms.error}</p> : null}
          {friends.error ? <p className="form-error workspace__error">{friends.error}</p> : null}
          {directChats.error ? (
            <p className="form-error workspace__error">{directChats.error}</p>
          ) : null}
          {roomMessages.error ? (
            <p className="form-error workspace__error">{roomMessages.error}</p>
          ) : null}
          {roomModeration.error ? (
            <p className="form-error workspace__error">{roomModeration.error}</p>
          ) : null}
          {roomInvitations.error ? (
            <p className="form-error workspace__error">{roomInvitations.error}</p>
          ) : null}
          {roomAttachments.error ? (
            <p className="form-error workspace__error">{roomAttachments.error}</p>
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
                onDeleteRoom={async () => {
                  await roomModeration.deleteRoom();
                }}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
              />
              <MessageList
                messages={roomMessages.messages}
                isLoading={roomMessages.isLoading}
                roomName={rooms.selectedRoom?.name ?? null}
                isMember={Boolean(rooms.selectedRoom?.isMember)}
                canModerate={Boolean(roomModeration.canModerate)}
                isDeleting={roomMessages.isDeleting}
                onDeleteMessage={roomMessages.deleteMessage}
              />
              <MessageComposer
                canSend={Boolean(rooms.selectedRoom?.isMember)}
                isSending={roomMessages.isSending}
                onSend={roomMessages.sendMessage}
              />
              <AttachmentUploader
                canUpload={Boolean(rooms.selectedRoom?.isMember)}
                isUploading={roomAttachments.isUploading}
                onUpload={roomAttachments.uploadAttachment}
              />
              <AttachmentList
                roomId={rooms.selectedRoom?.id ?? null}
                attachments={roomAttachments.attachments}
                isLoading={roomAttachments.isLoading}
                canView={Boolean(rooms.selectedRoom?.isMember)}
              />
              <FriendsPanel
                friends={friends.friends}
                incomingRequests={friends.incomingRequests}
                outgoingRequests={friends.outgoingRequests}
                isMutating={friends.isMutating}
                onAccept={friends.acceptRequest}
                onDecline={friends.declineRequest}
                onSelectFriend={directChats.setSelectedFriendId}
                selectedFriendId={directChats.selectedFriendId}
              />
              <DirectChatPanel
                chats={directChats.chats}
                selectedFriend={directChats.selectedFriend}
                messages={directChats.messages}
                isLoadingChats={directChats.isLoadingChats}
                isLoadingMessages={directChats.isLoadingMessages}
                isSending={directChats.isSending}
                onSelectFriend={directChats.setSelectedFriendId}
                onSendMessage={directChats.sendMessage}
              />
            </div>
          )}
        </main>

        <MemberPanel
          room={rooms.selectedRoom}
          currentUserId={session.user.id}
          currentUserRole={rooms.selectedRoom?.currentUserRole ?? null}
          bans={roomModeration.bans}
          canModerate={roomModeration.canModerate}
          isMutating={roomModeration.isMutating}
          isLoadingBans={roomModeration.isLoadingBans}
          onPromoteAdmin={roomModeration.promoteAdmin}
          onDemoteAdmin={roomModeration.demoteAdmin}
          onRemoveMember={roomModeration.removeMember}
          onBanUser={(userId) => roomModeration.banUser(userId)}
          onUnbanUser={roomModeration.unbanUser}
        />
      </div>

      {rooms.selectedRoom && rooms.selectedRoom.visibility === 'PRIVATE' ? (
        <InviteToRoomModal
          roomName={rooms.selectedRoom.name}
          isOpen={isInviteModalOpen}
          isSubmitting={roomModeration.isMutating}
          onClose={() => setIsInviteModalOpen(false)}
          onSubmit={roomModeration.inviteToPrivateRoom}
        />
      ) : null}
    </div>
  );
}
