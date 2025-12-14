#!/bin/bash

# Quick Start Script für die erste Einrichtung

set -e

echo "════════════════════════════════════════════"
echo "Webserver Multi-User Setup - Quick Start"
echo "════════════════════════════════════════════"
echo ""

# Scripts ausführbar machen
echo "[1/4] Mache Scripts ausführbar..."
chmod +x scripts/*.sh
echo "✓ Scripts sind jetzt ausführbar"
echo ""

# Infrastructure .env erstellen
echo "[2/4] Erstelle Infrastructure .env..."
if [ ! -f "infrastructure/.env" ]; then
    cp infrastructure/.env.example infrastructure/.env
    echo "✓ infrastructure/.env erstellt"
    echo "⚠ WICHTIG: Bitte ändere das MySQL Root Passwort in infrastructure/.env"
else
    echo "✓ infrastructure/.env existiert bereits"
fi
echo ""

# Docker Network erstellen
echo "[3/4] Erstelle Docker Network..."
if ! docker network ls | grep -q "webserver-network"; then
    docker network create webserver-network
    echo "✓ webserver-network erstellt"
else
    echo "✓ webserver-network existiert bereits"
fi
echo ""

# Infrastruktur starten
echo "[4/4] Starte Infrastruktur..."
cd infrastructure
docker compose up -d
cd ..
echo "✓ Infrastruktur gestartet"
echo ""

echo "════════════════════════════════════════════"
echo "✓ Setup abgeschlossen!"
echo "════════════════════════════════════════════"
echo ""
echo "Was läuft jetzt:"
docker ps --filter "network=webserver-network" --format "  - {{.Names}} ({{.Status}})"
echo ""
echo "Services:"
echo "  MariaDB:     192.168.2.125:3306"
echo "  phpMyAdmin:  http://192.168.2.125:8080"
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
