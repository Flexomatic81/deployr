#!/bin/bash

# Lokales Deploy-Script für Git-basierte Projekte
# Dieses Script auf deinem LOKALEN Rechner verwenden

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Zentrale Konfiguration laden (falls vorhanden)
CONFIG_FILE="$SCRIPT_DIR/config.sh"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi
# Fallback-Werte falls config.sh nicht existiert
SERVER_IP="${SERVER_IP:-192.168.2.125}"
DEFAULT_USER="${DEFAULT_USER:-mehmed}"

# Konfiguration anpassen!
SERVER="$DEFAULT_USER@$SERVER_IP"
USER="demo"
PROJECT="meinprojekt"
BRANCH="main"

echo "=== Deploy zu Server ==="
echo ""

# 1. Lokale Änderungen commiten
echo "[1/4] Git Status prüfen..."
if [[ -n $(git status -s) ]]; then
    echo "Uncommited changes gefunden. Commiten..."
    git add .
    read -p "Commit Message: " COMMIT_MSG
    git commit -m "$COMMIT_MSG"
else
    echo "✓ Keine uncommited changes"
fi

# 2. Zu Remote pushen
echo ""
echo "[2/4] Push zu Remote..."
git push origin $BRANCH
echo "✓ Gepusht"

# 3. Auf Server deployen
echo ""
echo "[3/4] Deploy auf Server..."
ssh $SERVER "cd /opt/webserver && ./scripts/git-deploy.sh $USER $PROJECT $BRANCH"

# 4. Fertig
echo ""
echo "════════════════════════════════════════════"
echo "✓ Deployment abgeschlossen!"
echo "════════════════════════════════════════════"
echo ""
echo "Dein Projekt ist jetzt live!"
echo ""
