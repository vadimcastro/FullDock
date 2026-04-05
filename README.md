# Project Template

A reusable project template for React/FastAPI/Postgres/Redis with Docker-first local development and shared base-image acceleration.

## 🎯 Features

- **Proven Tech Stack**: React + Next.js 14, FastAPI, PostgreSQL, Redis, Docker
- **Production Ready**: Includes deployment-focused Docker layouts
- **Complete Automation**: Comprehensive Makefile with deployment commands
- **Docker Everything**: Multi-environment Docker setup (dev/prod/HTTPS)
- **Security Built-in**: Environment-specific configurations, secret management
- **Mobile-First**: Responsive design patterns from successful project
- **Real-time Metrics**: Comprehensive dashboard with system monitoring
- **Production Monitoring**: CPU, memory, disk, network, and Docker metrics

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git configured
- SSH access to production server (for deployment)

### Environment Setup
```bash
cp .env.example .env.development
```
Edit `.env.development` as needed for your project.

### Create New Project
```bash
cd ~/Desktop/PROJECTS/project-template
make newpro
```

The script will guide you through:
- Project naming and configuration
- Admin user setup
- Production server details
- Infrastructure configuration

### Start Development
```bash
cd ../your-new-project
make dev              # Start all services
make auth             # Configure authentication
```

Visit http://localhost:3000 to see your project!

## Shared Base Images (Cross-Project Reuse)

`make dev` checks for shared base images before startup:
- `${PROJECT_SLUG}-frontend-base:latest`
- `${PROJECT_SLUG}-backend-base:latest`

Defaults:
- `PROJECT_SLUG=vpt-core` in `.env.development`
- New projects created with `make newpro` inherit this default

Behavior:
- First run on a machine: base images are built automatically
- Later runs in any project using the same `PROJECT_SLUG`: images are reused
- To force a dedicated image namespace per project: set a unique `PROJECT_SLUG`

## 🏗️ Template Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Language**: TypeScript
- **Icons**: Lucide React
- **Fonts**: Poppins (headings), Inter (body)

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **Database**: SQLAlchemy ORM with Alembic migrations
- **Cache**: Redis for session and performance
- **Auth**: JWT-based authentication
- **API**: RESTful with OpenAPI documentation

### Infrastructure
- **Development**: Docker Compose with hot reload
- **Production**: Multi-stage Docker builds
- **Database**: PostgreSQL 15 with health checks
- **Caching**: Redis 6 with persistence
- **Proxy**: Nginx with SSL support (HTTPS mode)

### Metrics & Monitoring
- **Real-time Dashboard**: System and application metrics
- **System Monitoring**: CPU, memory, disk usage with health checks
- **Docker Monitoring**: Container status and resource usage
- **Network Metrics**: Traffic analysis and connection monitoring
- **Application Health**: Performance tracking and uptime monitoring
- **Mobile-responsive**: Expandable metric cards for mobile devices

## 📁 Project Structure

```
your-project/
├── frontend/                 # Next.js application
│   ├── src/app/             # App Router pages
│   ├── src/components/      # Reusable components
│   │   └── dashboard/       # Metrics and monitoring components
│   ├── src/lib/             # Utilities and hooks
│   │   ├── api/             # API hooks and utilities
│   │   └── auth/            # Authentication context
│   ├── public/              # Static assets
│   ├── package.json         # Dependencies
│   ├── tailwind.config.js   # Styling configuration
│   └── tsconfig.json        # TypeScript config
├── backend/                 # FastAPI application
│   ├── app/                 # Application code
│   │   ├── api/             # API routes
│   │   │   └── v1/endpoints/# API endpoints including metrics
│   │   ├── core/            # Configuration
│   │   ├── crud/            # Database operations including metrics
│   │   ├── db/              # Database setup
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic schemas
│   ├── scripts/             # Utility scripts
│   ├── alembic/             # Database migrations
│   ├── requirements-minimal.txt
│   └── alembic.ini
├── docker/                  # Docker configurations
│   ├── docker-compose.yml   # Base services
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── docker-compose.https.yml
│   ├── Dockerfile           # Backend container
│   ├── frontend/
│   │   ├── Dockerfile       # Frontend production
│   │   └── Dockerfile.dev   # Frontend development
│   └── nginx/
│       └── nginx.conf       # HTTPS proxy config
├── scripts/                 # Setup and deployment
│   ├── setup-production-env.sh
│   └── setup-local-auth.sh
├── Makefile                 # Automation commands
├── .env.development         # Dev environment
└── README.md                # Project documentation
```

## 🔧 Development Commands

### Core Workflow
```bash
make dev                      # Start dev using existing images (fast)
make dev-build               # Rebuild app images, then start dev
make dev-ultra               # Use prebuilt shared base images
make dev-debug               # Start with debug logging
make auth                    # Configure local authentication
make logs                    # View container logs
make down                    # Stop containers
make clean                   # Clean up environment
make doctor                  # Preflight checks (docker/env/ports)
make disk-usage              # Docker image/volume/cache usage snapshot
make prune-safe              # Safe Docker cleanup
make cleanup-legacy-images   # Remove legacy image tags
```

### Project Creation
```bash
make newpro                  # Interactive fast project creation
```

### Database Management
```bash
make migrate                 # Run migrations
make migrate-create name=X   # Create new migration
```

### Code Quality
```bash
make format                  # Format code (Prettier + Black)
```

## 🚀 Deployment

### Initial Setup
```bash
make setup-prod-env          # Configure production secrets
```

Use your own deployment workflow (CI/CD, VPS scripts, managed platform, etc.). The template includes production compose files and env scaffolding, but no provider-specific deploy commands by default.

Recommended runtime for internet-facing production:
```bash
docker compose -f docker/docker-compose.https.yml up -d --build
```
This keeps API/DB/Redis private behind Nginx TLS ingress.

## 🔐 Security & Configuration

### Safety Features Summary
- Production startup hard-fails on weak/missing secrets and unsafe CORS.
- Login abuse protection includes Redis-backed throttling and temporary lockouts.
- Token flow supports refresh rotation and session revocation (`logout`, `logout-all`).
- Production defaults keep database/cache private and route traffic through TLS ingress.

### Environment Files
- **Development**: `.env.development` (included in template)
- **Production**: `.env.production.local` (generated by setup script)
- **Production Example**: `.env.production.local.example` (safe template, no real secrets)

### Secret Management
- All production secrets auto-generated during setup
- Database passwords, JWT keys, admin credentials
- Secrets stored locally and git-ignored
- Production startup fails fast if secrets are weak/missing

### Production Minimums Enforced
- `SECRET_KEY`: at least 32 characters and not a default value
- `ADMIN_PASSWORD`: at least 12 characters
- `POSTGRES_PASSWORD`: at least 12 characters
- `CORS_ORIGINS`: must be explicitly set and cannot include localhost or `*`

### Authentication
- JWT-based authentication system
- Admin user auto-created during setup
- Development: Simple credentials
- Production: Strong generated passwords
- Login abuse protections: Redis-backed failure counters + temporary lockouts
- Token lifecycle: access + refresh rotation, `logout`, and `logout-all`

### Auth Ops Playbook
- Watch API logs for `auth_event` entries where `event=login_blocked` or repeated `event=login_failed`.
- If suspicious activity continues, rotate `ADMIN_PASSWORD` and restart the stack.
- Trigger a user-wide session reset by calling `POST /api/v1/auth/logout-all` while authenticated.

## 🌐 Infrastructure Modes

### Development Mode
- Hot reload for frontend and backend
- Debug logging enabled
- Direct container access
- Simple authentication

### Production Mode  
- Optimized builds
- Health checks and restart policies
- Environment-specific configuration
- Strong security defaults

### HTTPS Mode
- Nginx reverse proxy
- SSL certificate integration
- Domain-based routing
- Production security headers
- Backend and Nginx both add baseline security headers in production

## 📊 Why This Template Works

- **Battle-Tested**: Live production use with real traffic
- **Mobile-First**: Responsive design that actually works
- **Performance**: Optimized Docker builds and caching
- **Security**: Production-grade secret management
- **Automation**: One-command deployments
- **Reliability**: Health checks and automatic restarts
- **Maintainability**: Clear structure and documentation

## 🔄 Workflow Integration

### Git Integration
- Automatic branch detection and deployment
- Git metadata injection into builds
- Branch-specific deployment commands

### Docker Optimization
- Multi-stage builds for production
- Layer caching for fast rebuilds
- Health checks for all services
- Volume management for data persistence
- `PROJECT_SLUG` controls reusable ultra base image names across projects
- `make build-base` creates `${PROJECT_SLUG}-frontend-base` and `${PROJECT_SLUG}-backend-base`
- Projects sharing the same `PROJECT_SLUG` can reuse those images with `make dev-ultra`

### Docker Disk Hygiene
- `make doctor` validates Docker daemon, environment files, and required ports.
- `make disk-usage` shows current image, volume, and build-cache usage.
- `make cleanup-legacy-images` removes old legacy image tags no longer used by VPT.
- `make prune-safe` performs conservative cleanup of stopped containers and dangling artifacts.
- Use aggressive Docker prune commands only when needed; they reclaim more space but force full rebuilds on next `make dev`.

### Development Experience
- Hot reload for instant feedback
- Comprehensive logging
- Easy database migrations
- One-command environment setup

## 🆘 Troubleshooting

### Common Issues

**Docker not starting:**
```bash
docker --version        # Check Docker installation
make clean             # Clean up containers
make dev               # Restart environment
```

**Database connection issues:**
```bash
make down              # Stop all containers
make clean-all         # Remove volumes
make dev               # Start fresh
```

**Authentication problems:**
```bash
make auth              # Reconfigure auth
make logs              # Check API logs
```

**API works on :8000 but frontend not on :3000:**
```bash
docker compose -f docker/docker-compose.dev.fast.yml logs -f frontend
```
Frontend in Docker must bind `0.0.0.0`. This template uses:
`next dev -H 0.0.0.0 -p 3000`

**Production deployment issues:**
```bash
make droplet-debug     # Check production status
make droplet-logs      # View detailed logs
make droplet-clean-rebuild  # Clean rebuild
```

## 🤝 Contributing

To improve this template:

1. Test changes against a real project
2. Update documentation
3. Maintain backward compatibility
4. Follow the established patterns

## 📄 License

MIT License - feel free to use for personal and commercial projects.
