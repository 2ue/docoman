# Docoman - Docker Compose Manager

A modern web-based Docker Compose file management system with React frontend and Node.js backend.

## Features

- 📁 **File Management**: Create, edit, delete, and organize Docker Compose files
- 🚀 **Service Control**: Start, stop, and monitor Docker Compose services
- 📊 **Real-time Status**: Live status updates for all services
- 🔍 **YAML Validation**: Real-time syntax validation and error highlighting
- 🎨 **Modern UI**: Beautiful interface built with React, Tailwind CSS, and shadcn-ui
- 🔄 **WebSocket Support**: Real-time updates and live logs
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Backend**: Node.js + TypeScript + Express + WebSocket
- **State Management**: Jotai atoms
- **Data Fetching**: React Query
- **Package Management**: pnpm workspace

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd docoman
pnpm install
```

### 2. Development

Start both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

### 3. Production Build

```bash
pnpm build
```

### 4. Docker Deployment

```bash
pnpm docker:build
pnpm docker:up
```

The application will be available at http://localhost:3000

## Configuration

### Backend Configuration

Copy `.env.example` to `.env` in `packages/backend/`:

```bash
# Environment
NODE_ENV=development
PORT=3001

# Docker Compose file directory
COMPOSE_DIRECTORY=../../docker-compose-files

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
```

### Directory Structure

```
docoman/
├── packages/
│   ├── frontend/          # React application
│   └── backend/           # Node.js API server
├── docker-compose-files/  # Managed Docker Compose files
├── docker-compose.yml     # Application deployment
└── README.md
```

## API Endpoints

### File Management
- `GET /api/files` - List all Docker Compose files
- `GET /api/files/:filename` - Get file content
- `POST /api/files` - Create new file
- `PUT /api/files/:filename` - Update file
- `DELETE /api/files/:filename` - Delete file

### Service Control
- `POST /api/services/:filename/start` - Start services
- `POST /api/services/:filename/stop` - Stop services
- `GET /api/services/:filename/status` - Get service status

### WebSocket Events
- Service start/stop progress updates
- Real-time log streaming
- Status change notifications

## Development

### Frontend Development

```bash
cd packages/frontend
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run linting
pnmp typecheck    # Type checking
```

### Backend Development

```bash
cd packages/backend
pnpm dev          # Start with hot reload
pnpm build        # Build TypeScript
pnpm start        # Run production build
```

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

Run linting and type checking:

```bash
pnpm lint
pnpm typecheck
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

The Docker deployment uses these environment variables:

- `NODE_ENV=production`
- `PORT=3001`
- `COMPOSE_DIRECTORY=/app/compose-files`

### Volume Mounts

- `/var/run/docker.sock` - Docker socket for container management
- `./docker-compose-files:/app/compose-files` - Compose file storage

## Security Considerations

- The application requires access to the Docker socket
- No authentication is implemented - designed for trusted environments
- CORS is configured for the specified origin
- File operations are restricted to the configured directory

## Troubleshooting

### Common Issues

1. **Docker not available**
   - Ensure Docker and Docker Compose are installed
   - Check Docker socket permissions

2. **Permission denied**
   - Ensure the user has access to Docker socket
   - Check file system permissions

3. **Port conflicts**
   - Change ports in configuration files
   - Check for other services using the same ports

4. **WebSocket connection failed**
   - Check network configuration
   - Verify proxy settings

### Logs

View application logs:

```bash
# Development
pnpm dev

# Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.