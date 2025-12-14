#!/bin/bash

# Quick Start Script für die erste Einrichtung

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "════════════════════════════════════════════"
echo "Webserver Multi-User Setup - Quick Start"
echo "════════════════════════════════════════════"
echo ""

# Config erstellen falls nicht vorhanden
if [ ! -f "$SCRIPT_DIR/config.sh" ]; then
    echo "[0/5] Server-Konfiguration erstellen..."
    echo -n "Server IP-Adresse eingeben (Standard: 192.168.2.125): "
    read INPUT_IP
    INPUT_IP=${INPUT_IP:-192.168.2.125}

    echo -n "Standard-Benutzer eingeben (Standard: mehmed): "
    read INPUT_USER
    INPUT_USER=${INPUT_USER:-mehmed}

    cp "$SCRIPT_DIR/config.sh.example" "$SCRIPT_DIR/config.sh"
    sed -i "s/SERVER_IP=\".*\"/SERVER_IP=\"$INPUT_IP\"/" "$SCRIPT_DIR/config.sh"
    sed -i "s/DEFAULT_USER=\".*\"/DEFAULT_USER=\"$INPUT_USER\"/" "$SCRIPT_DIR/config.sh"
    echo "✓ config.sh erstellt mit IP: $INPUT_IP"
    echo ""
fi

# Zentrale Konfiguration laden
source "$SCRIPT_DIR/config.sh"

# Scripts ausführbar machen
echo "[1/5] Mache Scripts ausführbar..."
chmod +x scripts/*.sh
echo "✓ Scripts sind jetzt ausführbar"
echo ""

# Infrastructure .env erstellen
echo "[2/5] Erstelle Infrastructure .env..."
if [ ! -f "infrastructure/.env" ]; then
    cp infrastructure/.env.example infrastructure/.env
    echo "✓ infrastructure/.env erstellt"
    echo "⚠ WICHTIG: Bitte ändere das MySQL Root Passwort in infrastructure/.env"
else
    echo "✓ infrastructure/.env existiert bereits"
fi
echo ""

# Docker Network erstellen
echo "[3/5] Erstelle Docker Network..."
if ! docker network ls | grep -q "webserver-network"; then
    docker network create webserver-network
    echo "✓ webserver-network erstellt"
else
    echo "✓ webserver-network existiert bereits"
fi
echo ""

# Infrastruktur starten
echo "[4/5] Starte Infrastruktur..."
cd infrastructure
docker compose up -d
cd ..
echo "✓ Infrastruktur gestartet"
echo ""

# Konfiguration anzeigen
echo "[5/5] Konfiguration prüfen..."
echo "✓ Server IP: $SERVER_IP"
echo ""

echo "════════════════════════════════════════════"
echo "✓ Setup abgeschlossen!"
echo "════════════════════════════════════════════"
echo ""
echo "Was läuft jetzt:"
docker ps --filter "network=webserver-network" --format "  - {{.Names}} ({{.Status}})"
echo ""
echo "Services:"
echo "  MariaDB:     $SERVER_IP:$MARIADB_PORT"
echo "  phpMyAdmin:  http://$SERVER_IP:$PHPMYADMIN_PORT"
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. MySQL Root Passwort ändern (falls noch nicht geschehen):"
echo "   nano infrastructure/.env"
echo ""
echo "2. Erstes Projekt erstellen:"
echo "   ./scripts/create-project.sh demo beispiel static-website"
echo ""
echo "3. Projekt starten:"
echo "   cd users/demo/beispiel"
echo "   docker compose up -d"
echo ""
echo "4. Alle Projekte anzeigen:"
echo "   ./scripts/list-projects.sh"
echo ""
echo "Vollständige Anleitung: siehe SETUP.md"
echo "════════════════════════════════════════════"
