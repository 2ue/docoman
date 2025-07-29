# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docoman is a web-based Docker Compose file management system with a React frontend and Node.js backend, managed as a pnpm monorepo. The system provides a modern UI for managing Docker Compose files in a specified directory without requiring a database.

## Tech Stack

**Frontend (@docoman/frontend):**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn-ui components
- Jotai for state management
- React Query for data fetching
- Monaco Editor for YAML editing

**Backend (@docoman/backend):**
- Node.js + TypeScript + Express
- File system-based storage (no database)
- Docker API integration

## Development Commands

**Root level:**
```bash
pnpm dev          # Start both frontend and backend in development mode
pnpm build        # Build both packages
pnpm lint         # Run linting on all packages
pnpm typecheck    # Run TypeScript checks on all packages
```

**Frontend (packages/frontend):**
```bash
pnpm dev          # Start Vite dev server on :3000
pnpm build        # Build for production
pnpm preview      # Preview production build
```

**Backend (packages/backend):**
```bash
pnpm dev          # Start with tsx watch on :3001
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled version
```

**Docker deployment:**
```bash
pnpm docker:build # Build Docker images
pnpm docker:up    # Start containers
pnpm docker:down  # Stop containers
```

## Architecture Notes

**File Structure:**
- `/packages/frontend/` - React SPA with proxy to backend API
- `/packages/backend/` - Express API server with Docker integration
- `/docker-compose-files/` - Directory for managed Docker Compose files
- Backend serves API on `/api/*`

**Key APIs:**
- `GET /api/files` - List all Docker Compose files with status
- `POST/PUT/DELETE /api/files/:filename` - CRUD operations
- `POST /api/services/:filename/start|stop` - Container management

**State Management:**
- Frontend uses Jotai atoms for state
- Backend caches file metadata in memory
- Real-time updates via polling for Docker status changes

**Docker Integration:**
- Backend requires `/var/run/docker.sock` mount for Docker API access
- Executes `docker-compose` commands via child_process
- Monitors container status for UI updates

## Important Implementation Details

- All Docker Compose files must be in configured `COMPOSE_DIRECTORY`
- YAML validation happens on both frontend (Monaco) and backend (js-yaml)
- File operations are atomic with proper error handling
- No authentication/authorization - designed for local/trusted environments