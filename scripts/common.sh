#!/bin/bash

# Gemeinsame Funktionen für alle Skripte

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker-Prüfung
check_docker() {
    # Docker installiert?
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker ist nicht installiert!${NC}"
        echo ""
        echo "Docker wird benötigt. Installation:"
        echo ""
        echo "  Schnell (alle Distributionen):"
        echo "    curl -fsSL https://get.docker.com | sh"
        echo "    sudo usermod -aG docker \$USER"
        echo "    # Danach neu einloggen!"
        echo ""
        echo "  Debian/Ubuntu:"
        echo "    sudo apt update && sudo apt install -y docker.io docker-compose-plugin"
        echo ""
        echo "  CentOS/RHEL/Fedora:"
        echo "    sudo dnf install -y docker docker-compose-plugin"
        echo "    sudo systemctl enable --now docker"
        echo ""
        echo "  Arch Linux:"
        echo "    sudo pacman -S docker docker-compose"
        echo "    sudo systemctl enable --now docker"
        echo ""
        exit 1
    fi

    # Docker Compose v2?
    if ! docker compose version &> /dev/null; then
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}✗ Docker Compose ist nicht installiert!${NC}"
            echo ""
            echo "Installation:"
            echo "  Debian/Ubuntu: sudo apt install -y docker-compose-plugin"
            echo "  CentOS/Fedora: sudo dnf install -y docker-compose-plugin"
            echo ""
            exit 1
        fi
    fi

    # Docker-Daemon läuft?
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker-Daemon läuft nicht!${NC}"
        echo ""
        echo "Starte Docker:"
        echo "  sudo systemctl start docker"
        echo ""
        echo "Oder prüfe ob dein User in der docker-Gruppe ist:"
        echo "  sudo usermod -aG docker \$USER"
        echo "  # Danach neu einloggen!"
        echo ""
        exit 1
    fi
}

# Konfiguration laden
load_config() {
    local script_dir="$1"
    local base_dir="$(dirname "$script_dir")"
    local config_file="$base_dir/config.sh"

    if [ -f "$config_file" ]; then
        source "$config_file"
    fi

    # Fallback-Werte
    SERVER_IP="${SERVER_IP:-192.168.2.125}"
    DEFAULT_USER="${DEFAULT_USER:-mehmed}"
    PHPMYADMIN_PORT="${PHPMYADMIN_PORT:-8080}"
    MARIADB_PORT="${MARIADB_PORT:-3306}"
}
