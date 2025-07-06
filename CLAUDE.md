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

## 🌐 Production Environment
- **Frontend**: http://{{PRODUCTION_IP}}:3000
- **API**: http://{{PRODUCTION_IP}}:8000
- **Status**: 🚧 Setup Required
- **Branch**: master

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

## 🖥️ vadimOS Integration
























































































































































































































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
**Project Navigation:** `vpt` → auto-navigate here  
**Development:** `gs`, `gcp "msg"`, `glog`, `dev`, `deploy`  
**Project Creation:** `newtest-lightning` → 40s standardized test projects, `newrun` → 35s interactive creation  
**Utilities:** `clean-dirs`, `kd`, `shortcuts`  
**Template Workflow:** Universal commands work in all generated projects

## ⚡ **BREAKTHROUGH PERFORMANCE (July 2025)**

### **🚀 Lightning-Fast Project Creation**
- **newtest-lightning**: Complete authenticated projects in ~40 seconds
- **newrun**: Interactive custom projects in ~35 seconds  
- **Dual service readiness**: Both frontend (3000) and backend (8000) verified before browser opening
- **CORS error elimination**: Backend API readiness prevents authentication failures
- **Base image optimization**: Pre-built Docker images reduce startup time significantly

### **🎯 Perfect Reliability**
```bash
# Every generated project includes:
✅ Working JWT authentication (mom@mom.com / meow)
✅ Complete React/FastAPI/PostgreSQL infrastructure  
✅ Docker development and production environments
✅ vadimOS integration with universal workflows
✅ Immediate VS Code + browser + terminal setup
✅ Zero CORS errors on subsequent runs
```

📖 **Complete Reference:** `/Users/vadimcastro/vadimOS.md`  
🔧 **Live Config:** `/Users/vadimcastro/.zshrc`  
🏗️ **Infrastructure:** `/Users/vadimcastro/Desktop/PROJECTS/vadimOS/`  
⚙️ **Claude Config:** `.claude/settings.local.json` (100+ permissions)
