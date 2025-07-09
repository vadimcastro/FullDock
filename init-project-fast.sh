#!/bin/bash

# Fast Project Template Initialization Script
# Optimized version that skips Docker startup for faster vadimOS integration

set -e

echo "⚡ Vadim's FAST Project Template Initializer"
echo "==========================================="
echo "Creating a new project based on proven React/FastAPI/Postgres/Docker stack"
echo ""

# Check if we're in the template directory
if [ ! -f "init-project-fast.sh" ]; then
    echo "❌ Please run this script from the vadim-project-template directory"
    exit 1
fi

# Get project information
echo "📋 Project Configuration (Required):"
read -p "Project name (lowercase, no spaces): " PROJECT_NAME
if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Project name must be lowercase letters, numbers, and hyphens only"
    exit 1
fi

read -p "Project display name [$PROJECT_NAME]: " PROJECT_DISPLAY_NAME
PROJECT_DISPLAY_NAME=${PROJECT_DISPLAY_NAME:-$PROJECT_NAME}

read -p "Project description: " PROJECT_DESCRIPTION

echo ""
echo "⚡ Default Configuration Preview:"
echo "  Admin: ${vadimOS_DEFAULT_ADMIN_EMAIL} (${vadimOS_DEFAULT_ADMIN_NAME})"
echo "  GitHub: https://github.com/${vadimOS_DEFAULT_GITHUB_USER}/$PROJECT_NAME"
echo "  Website: ${vadimOS_DEFAULT_WEBSITE}"
echo "  Production: ${vadimOS_DEFAULT_PRODUCTION_IP}"
echo "  Target: ${vadimOS_DEFAULT_TARGET_PATH}/$PROJECT_NAME"
echo ""
read -p "Continue with defaults and create project? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "📝 Proceeding with custom configuration..."
    
    echo ""
    echo "👤 Admin User Configuration:"
    read -p "Admin email [${vadimOS_DEFAULT_ADMIN_EMAIL}]: " ADMIN_EMAIL
    ADMIN_EMAIL=${ADMIN_EMAIL:-$vadimOS_DEFAULT_ADMIN_EMAIL}
    if [[ ! "$ADMIN_EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        echo "❌ Please enter a valid email address"
        exit 1
    fi

    read -p "Admin username [${vadimOS_DEFAULT_ADMIN_USERNAME}]: " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-$vadimOS_DEFAULT_ADMIN_USERNAME}
    read -p "Admin display name [${vadimOS_DEFAULT_ADMIN_NAME}]: " ADMIN_NAME
    ADMIN_NAME=${ADMIN_NAME:-$vadimOS_DEFAULT_ADMIN_NAME}
    read -p "Development password [${vadimOS_DEFAULT_DEV_PASSWORD}]: " DEV_PASSWORD
    DEV_PASSWORD=${DEV_PASSWORD:-$vadimOS_DEFAULT_DEV_PASSWORD}

    # Extract initials
    ADMIN_INITIALS=$(echo "$ADMIN_NAME" | grep -o '\b[A-Z]' | tr -d '\n')

    echo ""
    echo "🔗 Project Links (optional):"
else
    echo "⚡ Using defaults for fast setup..."
    
    # Set admin defaults from vadimOS environment variables
    ADMIN_EMAIL="$vadimOS_DEFAULT_ADMIN_EMAIL"
    ADMIN_USERNAME="$vadimOS_DEFAULT_ADMIN_USERNAME"
    ADMIN_NAME="$vadimOS_DEFAULT_ADMIN_NAME"
    DEV_PASSWORD="$vadimOS_DEFAULT_DEV_PASSWORD"
    
    # Extract initials
    ADMIN_INITIALS=$(echo "$ADMIN_NAME" | grep -o '\b[A-Z]' | tr -d '\n')
    
    # Set other defaults from vadimOS environment variables
    GITHUB_URL="https://github.com/${vadimOS_DEFAULT_GITHUB_USER}/$PROJECT_NAME"
    WEBSITE_URL="${vadimOS_DEFAULT_WEBSITE}"
    PRODUCTION_IP="${vadimOS_DEFAULT_PRODUCTION_IP}"
    LOCAL_HOST="${vadimOS_DEFAULT_LOCAL_HOST}"
    DROPLET_ALIAS="${vadimOS_DEFAULT_SSH_ALIAS}"
    
    # Jump to project creation
    TARGET_DIR="${vadimOS_DEFAULT_TARGET_PATH}"
    if [[ ! "$TARGET_DIR" =~ /$ ]]; then
        TARGET_DIR="$TARGET_DIR/"
    fi
    PROJECT_PATH="${TARGET_DIR}${PROJECT_NAME}"
    
    echo "🔍 Debug: PROJECT_NAME='$PROJECT_NAME'"
    echo "🔍 Debug: TARGET_DIR='$TARGET_DIR'"
    echo "🔍 Debug: PROJECT_PATH='$PROJECT_PATH'"
    
    if [ -d "$PROJECT_PATH" ]; then
        echo "❌ Directory $PROJECT_PATH already exists!"
        exit 1
    fi
    
    # Project creation section (defaults path)
    echo ""
    echo "⚡ Creating project (FAST MODE - skipping Docker startup)..."
    
    # Copy project files
    echo "📁 Copying project template..."
    cp -r . "$PROJECT_PATH"
    
    # Clean up init scripts
    rm "$PROJECT_PATH/init-project.sh" 2>/dev/null || true
    rm "$PROJECT_PATH/init-project-fast.sh" 2>/dev/null || true
    
    # Replace placeholders in all files
    find "$PROJECT_PATH" -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" -o -name "Makefile" -o -name "Dockerfile*" -o -name ".env*" -o -name "*.tsx" -o -name "*.ts" -o -name "*.py" \) -print0 | while IFS= read -r -d '' file; do
        sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g; s|{{PROJECT_DISPLAY_NAME}}|$PROJECT_DISPLAY_NAME|g; s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION|g; s|{{ADMIN_EMAIL}}|$ADMIN_EMAIL|g; s|{{ADMIN_USERNAME}}|$ADMIN_USERNAME|g; s|{{ADMIN_NAME}}|$ADMIN_NAME|g; s|{{ADMIN_INITIALS}}|$ADMIN_INITIALS|g; s|{{GITHUB_URL}}|$GITHUB_URL|g; s|{{WEBSITE_URL}}|$WEBSITE_URL|g; s|{{PRODUCTION_IP}}|$PRODUCTION_IP|g; s|{{LOCAL_HOST}}|$LOCAL_HOST|g; s|{{DROPLET_ALIAS}}|$DROPLET_ALIAS|g; s|{{DEV_PASSWORD}}|$DEV_PASSWORD|g" "$file"
    done
    
    # Create README
    cat > "$PROJECT_PATH/README.md" << EOF
# $PROJECT_DISPLAY_NAME

$PROJECT_DESCRIPTION

## Quick Start

\`\`\`bash
make dev              # Start development environment
make setup-local-auth # First-time auth setup
\`\`\`

## Links
- **GitHub**: $GITHUB_URL
- **Website**: $WEBSITE_URL
- **Production**: http://$PRODUCTION_IP:3000

Created from [vadim-project-template](https://github.com/vadimcastro/vadim-project-template) - A battle-tested React/FastAPI/Docker stack.
EOF
    
    # Navigate to project directory
    cd "$PROJECT_PATH"
    
    echo "💻 Project ready for VS Code opening..."
    
    echo ""
    echo "⚡ FAST MODE: Project ready for external development startup!"
    echo "📍 Project Path: $PROJECT_PATH"
    echo ""
    echo "🔑 Standardized Login Credentials:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   Password: $DEV_PASSWORD"
    echo ""
    echo "🚀 Use your vadimOS workflow to start development services!"
    
    # Debug output before final PROJECT_PATH
    echo "🔍 Final Debug: About to output PROJECT_PATH='$PROJECT_PATH'"
    
    # Output the project path for the shell alias to use
    echo "PROJECT_PATH:$PROJECT_PATH"
    exit 0
fi

echo "🔗 Project Links (optional):"
read -p "GitHub URL [https://github.com/${vadimOS_DEFAULT_GITHUB_USER}/$PROJECT_NAME]: " GITHUB_URL
GITHUB_URL=${GITHUB_URL:-https://github.com/${vadimOS_DEFAULT_GITHUB_USER}/$PROJECT_NAME}
read -p "Website URL [${vadimOS_DEFAULT_WEBSITE}]: " WEBSITE_URL
WEBSITE_URL=${WEBSITE_URL:-$vadimOS_DEFAULT_WEBSITE}

echo ""
echo "🌐 Infrastructure Configuration:"
read -p "Production server IP [${vadimOS_DEFAULT_PRODUCTION_IP}]: " PRODUCTION_IP
PRODUCTION_IP=${PRODUCTION_IP:-$vadimOS_DEFAULT_PRODUCTION_IP}
read -p "Domain name (optional, for HTTPS): " DOMAIN_NAME
read -p "SSH alias for production server [${vadimOS_DEFAULT_SSH_ALIAS}]: " DROPLET_ALIAS
DROPLET_ALIAS=${DROPLET_ALIAS:-$vadimOS_DEFAULT_SSH_ALIAS}

# Generate secure secret key
SECRET_KEY=$(openssl rand -base64 32)

# Create clean project name for bash functions (remove hyphens)
PROJECT_NAME_CLEAN=${PROJECT_NAME//-/}

echo ""
echo "📁 Target Directory:"
read -p "Where to create the project [${vadimOS_DEFAULT_TARGET_PATH}]: " TARGET_DIR
TARGET_DIR=${TARGET_DIR:-$vadimOS_DEFAULT_TARGET_PATH}

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
echo "Website: ${WEBSITE_URL:-\"Not provided\"}"
echo "Production IP: $PRODUCTION_IP"
echo "Domain: ${DOMAIN_NAME:-"Not configured"}"
echo "SSH Alias: $DROPLET_ALIAS"
echo "Target Path: $PROJECT_PATH"
echo ""

# Both paths (defaults and custom) merge here for project creation

echo ""
echo "⚡ Creating project (FAST MODE - skipping Docker startup)..."

# Copy template to target directory (exclude some heavy files if possible)
echo "📁 Copying template files..."
cp -r . "$PROJECT_PATH"

# Remove the init scripts from the new project
rm "$PROJECT_PATH/init-project.sh" 2>/dev/null || true
rm "$PROJECT_PATH/init-project-fast.sh" 2>/dev/null || true

# Optimized function to replace variables in files
replace_vars_fast() {
    local file="$1"
    if [ -f "$file" ]; then
        # Use a single sed command with all replacements for better performance
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
            -e "s|{{WEBSITE_URL}}|$WEBSITE_URL|g" \
            "$file" && rm "$file.tmp"
    fi
}

echo "🔧 Configuring project files (optimized)..."

# Export the function and variables before using them
export -f replace_vars_fast
export PROJECT_NAME ADMIN_EMAIL ADMIN_USERNAME ADMIN_NAME ADMIN_INITIALS PRODUCTION_IP DOMAIN_NAME DROPLET_ALIAS DEV_PASSWORD SECRET_KEY PROJECT_DISPLAY_NAME PROJECT_DESCRIPTION PROJECT_NAME_CLEAN GITHUB_URL WEBSITE_URL

# Process ALL files that need variable replacement (same as original script)
find "$PROJECT_PATH" -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" -o -name "Makefile" -o -name "Dockerfile*" -o -name ".env*" -o -name "*.tsx" -o -name "*.ts" -o -name "*.py" \) -print0 | while IFS= read -r -d '' file; do
    replace_vars_fast "$file"
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

## 📋 Login Credentials

### Development
- **Email**: $ADMIN_EMAIL
- **Password**: $DEV_PASSWORD

### Production
- Configure with: \`make setup-prod-env\`

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
echo "✅ FAST Project created successfully!"
echo ""

# Navigate to project directory
cd "$PROJECT_PATH"

echo "💻 Opening VS Code with documentation..."
if [[ -f "CLAUDE.md" ]]; then
    code . "CLAUDE.md"
elif [[ -f "README.md" ]]; then
    code . "README.md"
else
    code .
fi

echo ""
echo "⚡ FAST MODE: Project ready for external development startup!"
echo "📍 Project Path: $PROJECT_PATH"
echo ""
echo "🔑 Standardized Login Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $DEV_PASSWORD"
echo ""
echo "🚀 Use your vadimOS workflow to start development services!"

# Output the project path for the shell alias to use
echo "PROJECT_PATH:$PROJECT_PATH"