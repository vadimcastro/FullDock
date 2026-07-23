# docker/Dockerfile
FROM python:3.14-slim

WORKDIR /app

# Git information build args
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT_HASH=unknown
ARG GIT_COMMIT_MESSAGE=unknown
ARG GIT_COMMIT_DATE=unknown

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set git information as environment variables
ENV GIT_BRANCH=${GIT_BRANCH}
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}
ENV GIT_COMMIT_MESSAGE=${GIT_COMMIT_MESSAGE}
ENV GIT_COMMIT_DATE=${GIT_COMMIT_DATE}

# Copy requirements first for better caching
COPY backend/requirements-minimal.txt /app/
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements-minimal.txt

# Copy the rest of the application
COPY backend/ /app/

# Make the migration script executable
RUN chmod +x /app/scripts/migrate.sh

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
