# docker/frontend/Dockerfile
FROM node:22-alpine
WORKDIR /app
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_factor=2
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000
ENV npm_config_maxsockets=1
ENV npm_config_loglevel=error

# Copy package files from frontend directory
# The context is set to the project root in docker-compose files,
# so paths should be relative to project root
COPY frontend/package.json frontend/package-lock.json ./

# Install npm packages
RUN npm ci --no-audit --no-fund || npm ci --no-audit --no-fund

# Copy the rest of the frontend code (excluding node_modules)
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/next.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/tsconfig.json ./

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=https://api.{{DOMAIN_NAME}}
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build for production
RUN npm run build

# Verify build was successful
RUN ls -la .next/

# Expose port
EXPOSE 3000

# Start production server
CMD ["sh", "-c", "ls -la .next/ && npm start"]
