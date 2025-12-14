#!/bin/bash

# Script zum Erstellen eines neuen User-Projekts
# Verwendung: ./create-user.sh <username> <projektname> <template>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Parameter
USERNAME=$1
PROJECT_NAME=$2
TEMPLATE=${3:-static-website}

# Validierung
if [ -z "$USERNAME" ] || [ -z "$PROJECT_NAME" ]; then
    echo "Verwendung: $0 <username> <projektname> [template]"
    echo ""
    echo "Verfügbare Templates:"
    echo "  - static-website (Standard)"
    echo "  - php-website"
    echo "  - nodejs-app"
    exit 1
fi

# Template Pfad
TEMPLATE_PATH="$BASE_DIR/templates/$TEMPLATE"
if [ ! -d "$TEMPLATE_PATH" ]; then
    echo "Fehler: Template '$TEMPLATE' existiert nicht!"
    echo "Verfügbare Templates:"
    ls -1 "$BASE_DIR/templates/"
    exit 1
fi

# Ziel-Pfad
USER_DIR="$BASE_DIR/users/$USERNAME"
PROJECT_DIR="$USER_DIR/$PROJECT_NAME"

# User-Verzeichnis erstellen (falls nicht vorhanden)
if [ ! -d "$USER_DIR" ]; then
    echo "Erstelle User-Verzeichnis: $USER_DIR"
    mkdir -p "$USER_DIR"
fi

# Prüfen ob Projekt bereits existiert
if [ -d "$PROJECT_DIR" ]; then
    echo "Fehler: Projekt $PROJECT_NAME für User $USERNAME existiert bereits!"
    exit 1
fi

# Projekt aus Template erstellen
echo "Erstelle Projekt: $PROJECT_DIR"
cp -r "$TEMPLATE_PATH" "$PROJECT_DIR"

# .env Datei erstellen
if [ -f "$PROJECT_DIR/.env.example" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "✓ .env Datei erstellt (bitte anpassen!)"
fi

echo ""
echo "════════════════════════════════════════════"
echo "✓ Projekt erfolgreich erstellt!"
echo "════════════════════════════════════════════"
echo "User:     $USERNAME"
echo "Projekt:  $PROJECT_NAME"
echo "Template: $TEMPLATE"
echo "Pfad:     $PROJECT_DIR"
echo ""
echo "Nächste Schritte:"
echo "1. Konfiguration anpassen:"
echo "   cd $PROJECT_DIR"
echo "   nano .env"
echo ""
echo "2. Falls Datenbank benötigt:"
echo "   ./scripts/create-database.sh $USERNAME ${PROJECT_NAME}_db"
echo ""
echo "3. Container starten:"
echo "   cd $PROJECT_DIR"
echo "   docker-compose up -d"
echo ""
echo "4. In NPM die Domain konfigurieren und auf Port weiterleiten"
echo "   (siehe EXPOSED_PORT in .env)"
echo "════════════════════════════════════════════"
