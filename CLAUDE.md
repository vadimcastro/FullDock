# {{PROJECT_NAME}} Development Environment

## 🚀 Quick Start

### Local Development
```bash
make dev              # Start all services locally
make setup-local-auth # First-time auth setup
```

### Production Deployment
```bash
make droplet-deploy           # Standard deployment
make droplet-quick-deploy     # ⚡ Fast deployment (uses cache)
make droplet-quick-rebuild    # 🚀 Quick rebuild (partial cache clear)
make droplet-clean-rebuild    # 🧹 Deep clean rebuild (full cache clear)
```

## 🏗️ Tech Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python, SQLAlchemy, Alembic
- **Database**: PostgreSQL with Redis caching
- **Infrastructure**: Docker Compose, Production Server
- **Base Images**: template-frontend-base, template-backend-base (shared across all generated projects)

## 🌐 Production Environment
- **Frontend**: http://{{PRODUCTION_IP}}:3000
- **API**: http://{{PRODUCTION_IP}}:8000
- **Status**: 🚧 Setup Required
- **Branch**: master

## 🔧 Template Development with vptb

### Template Development Workflow
```bash
vptb                      # Start template development mode
# Prompts for:
# - Project name (e.g., feat/new-navbar)  
# - Display name (e.g., New Navigation Bar)
# - Description (e.g., Redesign navigation component)

# This will:
# 1. Create git branch for feature development
# 2. Generate docker-compose.dev.template.yml with dummy credentials
# 3. Open VS Code + start development environment
# 4. Enable login with mom@mom.com / meow for testing
```

### Template Development Commands
```bash
# After vptb setup:
cd docker
docker compose -f ../../vadimOS/docker/docker-compose.base.yml \
               -f docker-compose.yml \
               -f docker-compose.dev.ultra.yml \
               -f docker-compose.dev.template.yml up

# Login credentials for template development:
# Email: mom@mom.com
# Password: meow
```

### Template Development Guidelines
- **Keep placeholders intact**: Maintain {{PLACEHOLDER}} syntax in code
- **Test with dummy data**: Use mom@mom.com/meow for authentication testing
- **Git workflow**: Work in feature branches, commit improvements
- **Merge back**: Copy successful changes back to template
- **Documentation**: Update CLAUDE.md with new features

## ⚡ Terminal Workflow

### Quick Navigation & Git
```bash
# Add project alias to your shell config:
# alias {{PROJECT_NAME}}="cd ~/Desktop/PROJECTS/{{PROJECT_NAME}}"

{{PROJECT_NAME}}          # Navigate to project
gs                        # Git status
gcp "message"             # Add, commit, push in one command
glog                      # Show last commit
```

### Development Shortcuts
```bash
dev                       # Start development environment (alias for make dev)
deploy                    # Deploy current local branch to production (alias)
quick-deploy              # ⚡ Fast deployment (alias for make droplet-quick-deploy)
logs                      # View container logs (alias for make droplet-logs)
```

## 🔧 Essential Commands

### Development
```bash
make dev                  # Start development environment
make dev-ultra            # ⚡ Ultra-fast development with shared template base images
make setup-local-auth     # Configure local authentication
make logs                 # View container logs
make clean                # Clean up environment
```

### Deployment
```bash
make droplet-deploy                       # Deploy current branch to production
make droplet-deploy branch=BRANCH         # Deploy specific branch to production
make droplet-quick-deploy                 # ⚡ Fast deployment (uses cache)
make droplet-quick-rebuild                # 🚀 Quick rebuild (partial cache clear)
make droplet-clean-rebuild                # 🧹 Deep clean rebuild (full cache clear)
```

### Database
```bash
make migrate                       # Run migrations
make migrate-create name=NAME      # Create new migration
```

### Maintenance & Cleanup
```bash
make droplet-deep-clean        # 🧹 Comprehensive cleanup (Docker + logs + system updates)
make droplet-disk-usage        # 💾 Check disk usage and Docker stats
make clean-branches            # 🗑️ Delete all non-master branches locally
make droplet-clean-branches    # 🗑️ Delete all non-master branches on droplet
make help                      # 📖 Show all available commands
```

## 📁 Project Structure
```
├── frontend/           # Next.js application
├── backend/            # FastAPI application
├── docker/             # Docker configurations
├── scripts/            # Deployment & setup scripts
└── CLAUDE.md           # 📖 Development documentation
```

## 🎯 Current Development Focus

### ✅ Completed Features
- **Project Setup**: Complete infrastructure from vadim-project-template
- **Docker Environment**: Development and production containers configured
- **Authentication System**: JWT-based login with local dev setup
- **Database**: PostgreSQL with Alembic migrations
- **Production Deployment**: Automated deployment pipeline
- **Real-time Dashboard**: System monitoring with responsive design
- **Metrics System**: CPU, memory, disk, network, and Docker monitoring

### 🔄 Branch Management
```bash
# Quick git workflow
{{PROJECT_NAME}}                                    # Navigate to project
gs                                                 # Git status
gcp "commit message"                              # Add, commit, push in one command
glog                                              # Show last commit

# Deploy current local branch (auto-syncs with droplet)
deploy                                            # Deploy current local branch to droplet
make deploy                                       # Deploy current branch

# Deploy specific branch
make droplet-deploy branch=main                   # Deploy specific branch to droplet
```

## 🎨 Frontend Architecture

### Design System
- **Typography**: Poppins (headings), Inter (body)
- **Mobile-first**: `px-2 md:px-4`, `text-xs md:text-sm`
- **Icons**: Lucide React icons
- **Spacing**: Consistent responsive margins

### Contact Information
- **Email**: {{ADMIN_EMAIL}}
- **Admin**: {{ADMIN_NAME}}

## 🚀 Deployment Workflow

```bash
# 1. Development
git add . && git commit -m "feature: description"
git push origin feature-branch

# 2. Deploy
make droplet-deploy

# 3. Verify
curl http://{{PRODUCTION_IP}}:3000  # Frontend health check
```

### Troubleshooting
```bash
ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && docker compose -f docker/docker-compose.prod.yml logs -f'
make droplet-force-rebuild  # Force clean rebuild
```

## 📋 Login Credentials

### Development
- **Email**: {{ADMIN_EMAIL}}
- **Password**: {{DEV_PASSWORD}}

### Production
- Configure with: `make setup-prod-env`
- Credentials generated during setup

## 🛠️ Setup History

This project was created from the vadim-project-template, which is based on the successful vadimcastro.me infrastructure patterns:

- ✅ Proven React/FastAPI/Postgres/Docker stack
- ✅ Battle-tested deployment automation
- ✅ Production-grade security and configuration
- ✅ Mobile-first responsive design patterns
- ✅ Comprehensive development workflow


































































































## 🎯 vadimOS Development Values

**Core Principles:**
- **Efficiency First**: Every command should save time and reduce cognitive load
- **Universal Consistency**: Same commands work across all projects
- **Context Awareness**: Tools should understand the project environment
- **Fail Fast**: Clear error messages and quick recovery paths
- **Documentation as Code**: Keep docs in sync with reality

**Workflow Philosophy:**
- Minimize context switching between tools and projects
- Automate repetitive tasks (navigation, setup, deployment)
- Make complex operations simple and discoverable
- Ensure every project follows the same patterns
- Optimize for developer happiness and productivity

## 🔧 Core vadimOS Commands
**Project Navigation:** `vpt` (basic), `vptc` (code), `vptb` (browser+dev)  
**Development:** `gs`, `gcp "msg"`, `glog`, `dev`, `dev-ultra`, `deploy`  
**Project Creation:** `newtest` (32s standardized), `newpro` (interactive), `newrun` (legacy)  
**Authentication:** `auth-setup`, `auth-setup-fast`  
**Utilities:** `clean-dirs`, `kd`, `shortcuts`, `docs`  
**Base Images:** `build-base-all`, `clean-base`, `update-base`  
**Template Workflow:** Universal commands work in all generated projects

📖 **Complete Reference:** `/Users/vadimcastro/vadimOS.md`  
🔧 **Live Config:** `/Users/vadimcastro/.zshrc`  
🏗️ **Infrastructure:** `/Users/vadimcastro/Desktop/PROJECTS/vadimOS/`  
⚙️ **Claude Config:** `.claude/settings.local.json` (100+ permissions)
