#!/bin/bash
# entrypoint.sh - Workspace Container Startup

set -e

# ============================================================
# Environment Setup
# ============================================================

# Create workspace directory if not exists
mkdir -p /workspace

# Setup Claude Code if API key provided
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "Claude Code: API Key configured"
    # Claude Code will read from environment
fi

# Database connection info (if provided)
if [ -n "$DATABASE_URL" ]; then
    echo "Database: Connection configured"
fi

# ============================================================
# Git Configuration (if provided)
# ============================================================

if [ -n "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
fi

if [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.email "$GIT_USER_EMAIL"
fi

# ============================================================
# Start code-server
# ============================================================

# No authentication - access is controlled by the dashboard proxy
# The workspace container is only accessible via internal Docker network

# PROXY_BASE_PATH is set by the dashboard when starting the container
# e.g., /workspace-proxy/tetris
PROXY_BASE_PATH="${PROXY_BASE_PATH:-}"

exec code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth none \
    --disable-telemetry \
    /workspace
