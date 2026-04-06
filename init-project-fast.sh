#!/bin/bash

# Fast standalone project template initializer
# Creates a project without starting Docker services.

set -euo pipefail

if [ ! -f "init-project-fast.sh" ]; then
  echo "Please run this script from the project template directory."
  exit 1
fi

DEFAULT_ADMIN_EMAIL="admin@example.com"
DEFAULT_ADMIN_USERNAME="admin"
DEFAULT_ADMIN_NAME="Admin User"
DEFAULT_DEV_PASSWORD="changeme"
DEFAULT_GITHUB_USER="your-org"
DEFAULT_WEBSITE="https://example.com"
DEFAULT_PRODUCTION_IP="127.0.0.1"
DEFAULT_LOCAL_HOST="localhost"
DEFAULT_SSH_ALIAS="droplet"
DEFAULT_TARGET_PATH="../"
DEFAULT_PROJECT_SLUG="fulldock-core"
DEFAULT_OAUTH_ID="changeme"
DEFAULT_OAUTH_SECRET="changeme"

read_with_default() {
  local prompt="$1"
  local default_value="$2"
  local value
  read -r -p "$prompt [$default_value]: " value
  if [ -z "$value" ]; then
    printf '%s' "$default_value"
  else
    printf '%s' "$value"
  fi
}

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

echo "FullDock Project Initializer"
echo ""

PROJECT_NAME=""
while [ -z "$PROJECT_NAME" ]; do
  read -r -p "Project name (lowercase, numbers, hyphens): " PROJECT_NAME
  if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Invalid project name. Use lowercase letters, numbers, hyphens."
    PROJECT_NAME=""
  fi
done

PROJECT_DISPLAY_NAME="$(read_with_default "Project display name" "$PROJECT_NAME")"
read -r -p "Project description: " PROJECT_DESCRIPTION
PROJECT_TYPE="$(read_with_default "Project type" "standard")"

echo ""
echo "Use quick defaults? (Y/n)"
read -r quick_defaults

if [[ "${quick_defaults:-Y}" =~ ^[Nn]$ ]]; then
  ADMIN_EMAIL="$(read_with_default "Admin email" "$DEFAULT_ADMIN_EMAIL")"
  ADMIN_USERNAME="$(read_with_default "Admin username" "$DEFAULT_ADMIN_USERNAME")"
  ADMIN_NAME="$(read_with_default "Admin display name" "$DEFAULT_ADMIN_NAME")"
  DEV_PASSWORD="$(read_with_default "Development password" "$DEFAULT_DEV_PASSWORD")"
  GITHUB_URL="$(read_with_default "GitHub URL" "https://github.com/${DEFAULT_GITHUB_USER}/${PROJECT_NAME}")"
  WEBSITE_URL="$(read_with_default "Website URL" "$DEFAULT_WEBSITE")"
  PRODUCTION_IP="$(read_with_default "Production IP" "$DEFAULT_PRODUCTION_IP")"
  DOMAIN_NAME="$(read_with_default "Domain name" "example.local")"
  DROPLET_ALIAS="$DEFAULT_SSH_ALIAS"
  TARGET_DIR="$DEFAULT_TARGET_PATH"
  GOOGLE_ID="$(read_with_default "Google Client ID" "$DEFAULT_OAUTH_ID")"
  GOOGLE_SECRET="$(read_with_default "Google Client Secret" "$DEFAULT_OAUTH_SECRET")"
  GITHUB_ID="$(read_with_default "GitHub Client ID" "$DEFAULT_OAUTH_ID")"
  GITHUB_SECRET="$(read_with_default "GitHub Client Secret" "$DEFAULT_OAUTH_SECRET")"
else
  ADMIN_EMAIL="$DEFAULT_ADMIN_EMAIL"
  ADMIN_USERNAME="$DEFAULT_ADMIN_USERNAME"
  ADMIN_NAME="$DEFAULT_ADMIN_NAME"
  DEV_PASSWORD="$DEFAULT_DEV_PASSWORD"
  GITHUB_URL="https://github.com/${DEFAULT_GITHUB_USER}/${PROJECT_NAME}"
  WEBSITE_URL="$DEFAULT_WEBSITE"
  PRODUCTION_IP="$DEFAULT_PRODUCTION_IP"
  DOMAIN_NAME="example.local"
  DROPLET_ALIAS="$DEFAULT_SSH_ALIAS"
  TARGET_DIR="$DEFAULT_TARGET_PATH"
  GOOGLE_ID="$DEFAULT_OAUTH_ID"
  GOOGLE_SECRET="$DEFAULT_OAUTH_SECRET"
  GITHUB_ID="$DEFAULT_OAUTH_ID"
  GITHUB_SECRET="$DEFAULT_OAUTH_SECRET"
fi

if [[ ! "$ADMIN_EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
  echo "Invalid admin email."
  exit 1
fi

if [[ ! "$TARGET_DIR" =~ /$ ]]; then
  TARGET_DIR="$TARGET_DIR/"
fi

PROJECT_PATH="${TARGET_DIR}${PROJECT_NAME}"
if [ -e "$PROJECT_PATH" ]; then
  echo "Target already exists: $PROJECT_PATH"
  exit 1
fi

CURRENT_DIR="$(pwd)"
case "$PROJECT_PATH" in
  "$CURRENT_DIR"/*)
    echo "Target directory cannot be inside the template directory."
    exit 1
    ;;
esac

ADMIN_INITIALS="$(echo "$ADMIN_NAME" | awk '{for(i=1;i<=NF;i++) printf toupper(substr($i,1,1))}')"
PROJECT_NAME_CLEAN="${PROJECT_NAME//-/}"
SECRET_KEY="$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | head -c 32)"

echo ""
echo "[INFO] Creating project at: $PROJECT_PATH"
mkdir -p "$PROJECT_PATH"
cp -R . "$PROJECT_PATH"

rm -f "$PROJECT_PATH/init-project.sh" "$PROJECT_PATH/init-project-fast.sh"
rm -rf "$PROJECT_PATH/.git"

PROJECT_NAME_ESCAPED="$(escape_sed "$PROJECT_NAME")"
PROJECT_DISPLAY_NAME_ESCAPED="$(escape_sed "$PROJECT_DISPLAY_NAME")"
PROJECT_DESCRIPTION_ESCAPED="$(escape_sed "$PROJECT_DESCRIPTION")"
PROJECT_TYPE_ESCAPED="$(escape_sed "$PROJECT_TYPE")"
ADMIN_EMAIL_ESCAPED="$(escape_sed "$ADMIN_EMAIL")"
ADMIN_USERNAME_ESCAPED="$(escape_sed "$ADMIN_USERNAME")"
ADMIN_NAME_ESCAPED="$(escape_sed "$ADMIN_NAME")"
ADMIN_INITIALS_ESCAPED="$(escape_sed "$ADMIN_INITIALS")"
PRODUCTION_IP_ESCAPED="$(escape_sed "$PRODUCTION_IP")"
DOMAIN_NAME_ESCAPED="$(escape_sed "$DOMAIN_NAME")"
DROPLET_ALIAS_ESCAPED="$(escape_sed "$DROPLET_ALIAS")"
DEV_PASSWORD_ESCAPED="$(escape_sed "$DEV_PASSWORD")"
SECRET_KEY_ESCAPED="$(escape_sed "$SECRET_KEY")"
PROJECT_NAME_CLEAN_ESCAPED="$(escape_sed "$PROJECT_NAME_CLEAN")"
GITHUB_URL_ESCAPED="$(escape_sed "$GITHUB_URL")"
WEBSITE_URL_ESCAPED="$(escape_sed "$WEBSITE_URL")"
LOCAL_HOST_ESCAPED="$(escape_sed "$DEFAULT_LOCAL_HOST")"
GOOGLE_ID_ESCAPED="$(escape_sed "$GOOGLE_ID")"
GOOGLE_SECRET_ESCAPED="$(escape_sed "$GOOGLE_SECRET")"
GITHUB_ID_ESCAPED="$(escape_sed "$GITHUB_ID")"
GITHUB_SECRET_ESCAPED="$(escape_sed "$GITHUB_SECRET")"

replace_vars() {
  local file="$1"
  [ -f "$file" ] || return 0

  sed -i.bak \
    -e "s|{{PROJECT_NAME}}|$PROJECT_NAME_ESCAPED|g" \
    -e "s|{{PROJECT_DISPLAY_NAME}}|$PROJECT_DISPLAY_NAME_ESCAPED|g" \
    -e "s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION_ESCAPED|g" \
    -e "s|{{PROJECT_TYPE}}|$PROJECT_TYPE_ESCAPED|g" \
    -e "s|{{ADMIN_EMAIL}}|$ADMIN_EMAIL_ESCAPED|g" \
    -e "s|{{ADMIN_USERNAME}}|$ADMIN_USERNAME_ESCAPED|g" \
    -e "s|{{ADMIN_NAME}}|$ADMIN_NAME_ESCAPED|g" \
    -e "s|{{ADMIN_INITIALS}}|$ADMIN_INITIALS_ESCAPED|g" \
    -e "s|{{PRODUCTION_IP}}|$PRODUCTION_IP_ESCAPED|g" \
    -e "s|{{DOMAIN_NAME}}|$DOMAIN_NAME_ESCAPED|g" \
    -e "s|{{DROPLET_ALIAS}}|$DROPLET_ALIAS_ESCAPED|g" \
    -e "s|{{DEV_PASSWORD}}|$DEV_PASSWORD_ESCAPED|g" \
    -e "s|{{SECRET_KEY}}|$SECRET_KEY_ESCAPED|g" \
    -e "s|{{PROJECT_NAME_CLEAN}}|$PROJECT_NAME_CLEAN_ESCAPED|g" \
    -e "s|{{GITHUB_URL}}|$GITHUB_URL_ESCAPED|g" \
    -e "s|{{WEBSITE_URL}}|$WEBSITE_URL_ESCAPED|g" \
    -e "s|{{LOCAL_HOST}}|$LOCAL_HOST_ESCAPED|g" \
    -e "s|{{GOOGLE_CLIENT_ID}}|$GOOGLE_ID_ESCAPED|g" \
    -e "s|{{GOOGLE_CLIENT_SECRET}}|$GOOGLE_SECRET_ESCAPED|g" \
    -e "s|{{GITHUB_CLIENT_ID}}|$GITHUB_ID_ESCAPED|g" \
    -e "s|{{GITHUB_CLIENT_SECRET}}|$GITHUB_SECRET_ESCAPED|g" \
    "$file"
  rm -f "${file}.bak"
}

find "$PROJECT_PATH" -type f \
  \( -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.sh" -o -name "*.md" \
     -o -name "*.conf" -o -name "Makefile" -o -name "Dockerfile*" -o -name ".env*" \
     -o -name "*.tsx" -o -name "*.ts" -o -name "*.py" \) \
  -print0 | while IFS= read -r -d '' file; do
  replace_vars "$file"
done

cat > "$PROJECT_PATH/README.md" << EOF
# $PROJECT_DISPLAY_NAME

$PROJECT_DESCRIPTION

## Quick Start

\`\`\`bash
make dev
make auth
\`\`\`

## Local URLs
- Frontend: http://localhost:3000
- API: http://localhost:8000

## Shared Docker Base Images
- PROJECT_SLUG: $DEFAULT_PROJECT_SLUG
- First run builds shared base images; later projects with the same slug reuse them.

## Defaults
- Admin email: $ADMIN_EMAIL
- Admin password: $DEV_PASSWORD

## Links
- GitHub: $GITHUB_URL
- Website: $WEBSITE_URL
EOF

if [ -f "$PROJECT_PATH/.env.development" ]; then
  sed -i.bak -e "s|^PROJECT_SLUG=.*|PROJECT_SLUG=$DEFAULT_PROJECT_SLUG|" "$PROJECT_PATH/.env.development"
  rm -f "$PROJECT_PATH/.env.development.bak"
fi

echo ""
echo "Project created."
echo "Path: $PROJECT_PATH"
echo "PROJECT_PATH:$PROJECT_PATH"
