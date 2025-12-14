#!/bin/bash

# Git Deploy Script
# Verwendung: ./git-deploy.sh <user> <projekt> [branch]

set -e

USER=$1
PROJECT=$2
BRANCH=${3:-main}

if [ -z "$USER" ] || [ -z "$PROJECT" ]; then
    echo "Verwendung: $0 <user> <projekt> [branch]"
    exit 1
fi

PROJECT_PATH="/opt/webserver/users/$USER/$PROJECT"
HTML_PATH="$PROJECT_PATH/html"

echo "=== Git Deploy ==="
echo "User:    $USER"
echo "Projekt: $PROJECT"
echo "Branch:  $BRANCH"
echo ""

# Git pull
echo "[1/3] Git Pull..."
cd "$HTML_PATH"
git fetch origin
git reset --hard origin/$BRANCH
echo "✓ Code aktualisiert"

# Permissions setzen
echo "[2/3] Setze Permissions..."
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
echo "✓ Permissions gesetzt"

# Container neu starten
echo "[3/3] Container neu starten..."
cd "$PROJECT_PATH"
docker compose restart
echo "✓ Container neu gestartet"

echo ""
echo "✓ Deployment abgeschlossen!"
echo ""

# Container Status zeigen
docker compose ps

