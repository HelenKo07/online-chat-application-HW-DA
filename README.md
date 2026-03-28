# Online Chat Application HW

Stages 1-9 establish the technical foundation for a classic web chat application,
including authentication, public room management, persistent room messages,
friends, direct messaging, presence tracking, unread indicators, room moderation,
and room attachments stored on the local filesystem.

## Stack

- Client: React + TypeScript + Vite
- Server: NestJS
- Database: PostgreSQL
- Realtime: Socket.IO (planned in a later stage)
- Delivery: Docker Compose + Nginx

## Project structure

```text
.
├── client/    # React application and Nginx config
├── server/    # NestJS API skeleton
└── docker-compose.yml
```

## Run with Docker

```bash
docker compose up --build
```

After startup:

- client: http://localhost:8080
- API health check: http://localhost:3000/api/health

## Local development

Install dependencies in each workspace:

```bash
cd client && npm install
cd ../server && npm install
```

Run the client:

```bash
cd client
npm run dev
```

Run the server:

```bash
cd server
npm run start:dev
```

## Current stage

This repository currently includes:

- monorepo-style structure with `client` and `server`
- component-based React frontend with mobile-first layout
- NestJS API with auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- room endpoints: `/api/rooms`, `/api/rooms/:roomId`, `/api/rooms/:roomId/join`, `/api/rooms/:roomId/leave`
- room message endpoints: `/api/rooms/:roomId/messages`
- friend endpoints: `/api/friends`, `/api/friends/requests`, `/api/friends/requests/:requestId/accept`
- direct chat endpoints: `/api/direct-chats`, `/api/direct-chats/:friendId/messages`
- presence endpoint: `/api/presence/heartbeat`
- unread counters for rooms and direct chats
- room moderation endpoints for owner/admin actions, bans, and private invitations
- room attachment endpoints for upload, list, and download
- Prisma schema for `User`, `Session`, `Room`, `RoomMember`, `RoomBan`, `RoomInvitation`, `RoomAttachment`, `Message`, `FriendRequest`, `Friendship`, `DirectChat`, `DirectMessage`, `UserPresence`, `RoomRead`, and `DirectChatRead`
- PostgreSQL container wired into Docker Compose

## Auth flow implemented in stage 2

- self-registration with `email`, `username`, and `password`
- login with persistent `httpOnly` cookie session
- logout for the current browser session
- current user endpoint
- PostgreSQL persistence for users and sessions

## Rooms flow implemented in stage 3

- create public or private rooms
- browse room catalog
- inspect room details and members
- join public rooms
- leave joined rooms
- enforce the rule that the owner cannot leave their own room

## Messages flow implemented in stage 4

- store room messages in PostgreSQL
- load room history for current members
- send messages from the room composer
- block message access for non-members

## Friends and direct messages implemented in stage 5

- send friend requests by username
- accept or decline incoming requests
- list established friendships
- open direct chats between friends only
- persist direct messages in PostgreSQL

## Presence and unread indicators implemented in stage 6

- track `online`, `afk`, and `offline` status through authenticated heartbeat updates
- surface presence in friend lists and room member lists
- persist read markers for rooms and direct chats
- show unread counters for room lists and direct chat lists
- clear unread counters when the user opens the corresponding conversation

## Moderation and private invitations implemented in stage 7

- owner-only room deletion
- owner can promote members to admins
- owner/admin can demote admins (owner role is immutable)
- owner/admin can remove members (treated as room ban)
- owner/admin can ban and unban users
- admins can view room ban list including who issued each ban
- private room invitations by username
- invited users can list, accept, or decline invitations
- joining private rooms requires invitation, and banned users cannot join
- room message deletion by author or room admin/owner

## Files and images implemented in stage 8

- upload files and images in room chats
- download attachments by current room members only
- preserve original file names and optional comments
- enforce limits: files up to 20 MB and images up to 3 MB
- store files on local server filesystem (`/app/uploads` in Docker)
- persist metadata in PostgreSQL through `RoomAttachment`

## Full-spec alignment implemented in stage 9

- multi-tab presence heartbeat support using per-tab client activity aggregation
- active sessions screen with selective session revocation
- password change for logged-in users
- password reset endpoint (without email verification flow)
- account deletion endpoint with password confirmation
- paginated room history API and frontend older-message loading for infinite-scroll style access
- UI polish through account management panels and improved moderation ergonomics

## Next implementation steps

- realtime transport with Socket.IO
- richer message features like replies and editing
- user-to-user bans and richer attachment controls (preview, delete, moderation logs)
