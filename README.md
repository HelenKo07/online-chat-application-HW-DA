# Online Chat Application HW

Stages 1-4 establish the technical foundation for a classic web chat application,
including authentication, public room management, and persistent room messages.

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
- Prisma schema for `User`, `Session`, `Room`, `RoomMember`, and `Message`
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

## Next implementation steps

- persistent messages
- friendships and direct messages
- realtime presence and unread indicators
