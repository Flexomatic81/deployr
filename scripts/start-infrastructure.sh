#!/bin/bash

# Startet die zentrale Infrastruktur (MariaDB, phpMyAdmin)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$BASE_DIR/infrastructure"

# Zentrale Konfiguration laden
CONFIG_FILE="$BASE_DIR/config.sh"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi
# Fallback-Werte falls config.sh nicht existiert
SERVER_IP="${SERVER_IP:-192.168.2.125}"
PHPMYADMIN_PORT="${PHPMYADMIN_PORT:-8080}"
MARIADB_PORT="${MARIADB_PORT:-3306}"

echo "Starte Infrastruktur..."

cd "$INFRA_DIR"

# .env prüfen
if [ ! -f ".env" ]; then
    echo "⚠ Warnung: .env Datei nicht gefunden!"
    echo "Erstelle .env aus .env.example..."
    cp .env.example .env
    echo ""
    echo "WICHTIG: Bitte ändere das MySQL Root Passwort in:"
    echo "$INFRA_DIR/.env"
    echo ""
    read -p "Drücke Enter um fortzufahren..."
fi

# Docker Network erstellen (falls nicht vorhanden)
if ! docker network ls | grep -q "webserver-network"; then
    echo "Erstelle Docker Network: webserver-network"
    docker network create webserver-network
fi

# Infrastruktur starten
docker-compose up -d

echo ""
echo "════════════════════════════════════════════"
echo "✓ Infrastruktur gestartet!"
echo "════════════════════════════════════════════"
echo ""
docker-compose ps
echo ""
echo "Services:"
echo "  MariaDB:     $SERVER_IP:$MARIADB_PORT"
echo "  phpMyAdmin:  http://$SERVER_IP:$PHPMYADMIN_PORT"
echo "               (oder über NPM exposen)"
echo "════════════════════════════════════════════"
