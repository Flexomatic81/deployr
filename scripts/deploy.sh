#!/bin/bash
# Dployr Deploy Script
# Updates the repository and rebuilds the dashboard with version information

set -e
cd "$(dirname "$0")/.."

echo "=== Dployr Deploy ==="

# Git Pull
echo "Updating repository..."
git pull

# Get version information
export GIT_HASH=$(git rev-parse --short HEAD)
export GIT_DATE=$(git log -1 --format=%cd --date=format:'%d.%m.%Y')

echo "Version: $GIT_HASH ($GIT_DATE)"

# Build dashboard
echo "Building dashboard..."
docker compose build dashboard

# Start dashboard
echo "Starting dashboard..."
docker compose up -d dashboard

echo "=== Done ==="
