# Online Chat Application HW

Stage 1 establishes the technical foundation for a classic web chat application.

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
- classic chat layout prototype on the frontend
- NestJS API skeleton with `/api/health` and `/api/meta`
- PostgreSQL container wired into Docker Compose

## Next implementation steps

- authentication and user entity
- rooms and room membership
- persistent messages
- friendships and direct messages
- realtime presence and unread indicators
