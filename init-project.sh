#!/bin/bash

# Project Template Initialization Script
# Based on vadimcastro.me successful infrastructure patterns

set -e

echo "🚀 Vadim's Project Template Initializer"
echo "======================================="
echo "Creating a new project based on proven React/FastAPI/Postgres/Docker stack"
echo ""

# Check if we're in the template directory
if [ ! -f "init-project.sh" ]; then
    echo "❌ Please run this script from the vadim-project-template directory"
    exit 1
fi

# Get project information
echo "📋 Project Configuration:"
read -p "Project name (lowercase, no spaces): " PROJECT_NAME
if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Project name must be lowercase letters, numbers, and hyphens only"
    exit 1
fi

read -p "Project display name [$PROJECT_NAME]: " PROJECT_DISPLAY_NAME
PROJECT_DISPLAY_NAME=${PROJECT_DISPLAY_NAME:-$PROJECT_NAME}

read -p "Project description: " PROJECT_DESCRIPTION

echo ""
echo "👤 Admin User Configuration:"
read -p "Admin email: " ADMIN_EMAIL
if [[ ! "$ADMIN_EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
    echo "❌ Please enter a valid email address"
    exit 1
fi

read -p "Admin username: " ADMIN_USERNAME
read -p "Admin display name: " ADMIN_NAME

# Extract initials
ADMIN_INITIALS=$(echo "$ADMIN_NAME" | grep -o '\b[A-Z]' | tr -d '\n')

echo ""
echo "🔗 Social Links (optional):"
read -p "GitHub URL (e.g., https://github.com/username): " GITHUB_URL
read -p "LinkedIn URL (e.g., https://linkedin.com/in/username): " LINKEDIN_URL
read -p "Website URL (e.g., https://yoursite.com): " WEBSITE_URL

echo ""
echo "🌐 Infrastructure Configuration:"
read -p "Production server IP (e.g., 206.81.2.168): " PRODUCTION_IP
read -p "Domain name (optional, for HTTPS): " DOMAIN_NAME
read -p "SSH alias for production server [droplet]: " DROPLET_ALIAS
DROPLET_ALIAS=${DROPLET_ALIAS:-droplet}

read -p "Development password [meow]: " DEV_PASSWORD
DEV_PASSWORD=${DEV_PASSWORD:-meow}

# Generate secure secret key
SECRET_KEY=$(openssl rand -base64 32)

# Create clean project name for bash functions (remove hyphens)
PROJECT_NAME_CLEAN=${PROJECT_NAME//-/}

echo ""
echo "📁 Target Directory:"
read -p "Where to create the project [../]: " TARGET_DIR
TARGET_DIR=${TARGET_DIR:-../}

# Ensure target directory ends with slash
if [[ ! "$TARGET_DIR" =~ /$ ]]; then
    TARGET_DIR="$TARGET_DIR/"
fi

PROJECT_PATH="${TARGET_DIR}${PROJECT_NAME}"

if [ -d "$PROJECT_PATH" ]; then
    echo "❌ Directory $PROJECT_PATH already exists!"
    exit 1
fi

echo ""
echo "📋 Configuration Summary:"
echo "========================="
echo "Project Name: $PROJECT_NAME"
echo "Display Name: $PROJECT_DISPLAY_NAME"  
echo "Description: $PROJECT_DESCRIPTION"
echo "Admin Email: $ADMIN_EMAIL"
echo "Admin Username: $ADMIN_USERNAME"
echo "Admin Name: $ADMIN_NAME"
echo "Admin Initials: $ADMIN_INITIALS"
echo "GitHub: ${GITHUB_URL:-\"Not provided\"}"
echo "LinkedIn: ${LINKEDIN_URL:-\"Not provided\"}"
echo "Website: ${WEBSITE_URL:-\"Not provided\"}"
echo "Production IP: $PRODUCTION_IP"
echo "Domain: ${DOMAIN_NAME:-"Not configured"}"
echo "SSH Alias: $DROPLET_ALIAS"
echo "Target Path: $PROJECT_PATH"
echo ""

read -p "Proceed with project creation? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Project creation cancelled"
    exit 1
fi

echo ""
echo "🛠️  Creating project..."

# Copy template to target directory
cp -r . "$PROJECT_PATH"

# Remove the init script from the new project
rm "$PROJECT_PATH/init-project.sh"

# Function to replace variables in files
replace_vars() {
    local file="$1"
    if [ -f "$file" ]; then
        sed -i.tmp \
            -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
            -e "s|{{PROJECT_DISPLAY_NAME}}|$PROJECT_DISPLAY_NAME|g" \
            -e "s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION|g" \
            -e "s|{{ADMIN_EMAIL}}|$ADMIN_EMAIL|g" \
            -e "s|{{ADMIN_USERNAME}}|$ADMIN_USERNAME|g" \
            -e "s|{{ADMIN_NAME}}|$ADMIN_NAME|g" \
            -e "s|{{ADMIN_INITIALS}}|$ADMIN_INITIALS|g" \
            -e "s|{{PRODUCTION_IP}}|$PRODUCTION_IP|g" \
            -e "s|{{DOMAIN_NAME}}|$DOMAIN_NAME|g" \
            -e "s|{{DROPLET_ALIAS}}|$DROPLET_ALIAS|g" \
            -e "s|{{DEV_PASSWORD}}|$DEV_PASSWORD|g" \
            -e "s|{{SECRET_KEY}}|$SECRET_KEY|g" \
            -e "s|{{PROJECT_NAME_CLEAN}}|$PROJECT_NAME_CLEAN|g" \
            -e "s|{{GITHUB_URL}}|$GITHUB_URL|g" \
            -e "s|{{LINKEDIN_URL}}|$LINKEDIN_URL|g" \
            -e "s|{{WEBSITE_URL}}|$WEBSITE_URL|g" \
            "$file" && rm "$file.tmp"
    fi
}

echo "🔧 Configuring project files..."

# Export the function and variables before using them
export -f replace_vars
export PROJECT_NAME ADMIN_EMAIL ADMIN_USERNAME ADMIN_NAME ADMIN_INITIALS PRODUCTION_IP DOMAIN_NAME DROPLET_ALIAS DEV_PASSWORD SECRET_KEY PROJECT_DISPLAY_NAME PROJECT_DESCRIPTION PROJECT_NAME_CLEAN GITHUB_URL LINKEDIN_URL WEBSITE_URL

# Replace variables in configuration files
find "$PROJECT_PATH" -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" -o -name "Makefile" -o -name "Dockerfile*" -o -name ".env*" -o -name "*.tsx" -o -name "*.ts" -o -name "*.py" \) -print0 | while IFS= read -r -d '' file; do
    replace_vars "$file"
done

echo "📝 Creating project README..."

# Create project-specific README
cat > "$PROJECT_PATH/README.md" << EOF
# $PROJECT_DISPLAY_NAME

$PROJECT_DESCRIPTION

## 🚀 Quick Start

### Local Development
\`\`\`bash
make dev              # Start all services locally
make setup-local-auth # First-time auth setup
\`\`\`

### Production Deployment
\`\`\`bash
make droplet-deploy           # Standard deployment
make droplet-quick-deploy     # ⚡ Fast deployment (uses cache)
make droplet-clean-rebuild    # 🧹 Deep clean rebuild
\`\`\`

## 🏗️ Tech Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python, SQLAlchemy, Alembic
- **Database**: PostgreSQL with Redis caching
- **Infrastructure**: Docker Compose, Production Server

## 🌐 Production Environment
- **Frontend**: http://$PRODUCTION_IP:3000
- **API**: http://$PRODUCTION_IP:8000
- **Status**: 🚧 Setup Required

## 🔧 Essential Commands

### Development
\`\`\`bash
make dev                      # Start development environment
make setup-local-auth         # Configure local authentication
make logs                     # View container logs
make clean                    # Clean up environment
\`\`\`

### Deployment
\`\`\`bash
make droplet-deploy           # Deploy current branch to production
make droplet-quick-deploy     # ⚡ Fast deployment
make droplet-clean-rebuild    # 🧹 Deep clean rebuild
\`\`\`

### Database
\`\`\`bash
make migrate                  # Run migrations
make migrate-create name=NAME # Create new migration
\`\`\`

## 📋 Login Credentials

### Development
- **Email**: $ADMIN_EMAIL
- **Password**: $DEV_PASSWORD

### Production
- Configure with: \`make setup-prod-env\`

## 🛠️ Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   # Ensure Docker is running
   docker --version
   \`\`\`

2. **Start Development Environment**
   \`\`\`bash
   make dev
   make setup-local-auth
   \`\`\`

3. **Access Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Production Setup**
   \`\`\`bash
   make setup-prod-env    # Configure production secrets
   make droplet-deploy    # Deploy to production
   \`\`\`

## 📁 Project Structure
\`\`\`
├── frontend/           # Next.js application
├── backend/            # FastAPI application
├── docker/             # Docker configurations
├── scripts/            # Deployment & setup scripts
└── docs/               # Documentation
\`\`\`

Created from [vadim-project-template](https://github.com/vadimcastro/vadim-project-template) - A battle-tested React/FastAPI/Docker stack.
EOF

echo ""
echo "✅ Project created successfully!"
echo ""

# Navigate to project and open VS Code immediately
cd "$PROJECT_PATH"

echo "💻 Opening VS Code with documentation..."
if [[ -f "CLAUDE.md" ]]; then
    code . "CLAUDE.md"
elif [[ -f "README.md" ]]; then
    code . "README.md"
else
    code .
fi

echo "🚀 Starting development environment and configuring authentication..."

# Start services in background
echo "Starting Docker services..."
make dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for services to be ready using health checks
echo "Waiting for services to initialize..."
if [ -f "scripts/docker-health.sh" ]; then
    source scripts/docker-health.sh
    echo "🏥 Running health checks before proceeding..."
    if wait_for_services 3000 8000; then
        echo "✅ Services are ready!"
    else
        echo "⚠️  Services taking longer than expected, continuing anyway..."
    fi
else
    # Fallback to sleep if health functions not available
    sleep 10
fi

# Setup authentication
echo "Configuring local authentication..."
make setup-local-auth

# Let user know everything is ready
echo ""
echo "🎉 Setup Complete!"
echo "📍 Project Path: $PROJECT_PATH"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "📊 Dashboard: http://localhost:3000/dashboard"
echo ""
echo "🔑 Login Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $DEV_PASSWORD"
echo ""
echo "📖 For production deployment:"
echo "1. Configure SSH access to your production server"
echo "2. make setup-prod-env"
echo "3. make droplet-deploy"
echo ""
echo "🚀 Happy coding with your new $PROJECT_DISPLAY_NAME project!"

# Output the project path for the shell alias to use
echo "PROJECT_PATH:$PROJECT_PATH"