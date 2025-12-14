# Setup-Anleitung

Schritt-für-Schritt Anleitung für die Installation auf einem Linux-Server.

> **Hinweis**: Die Server-IP wird bei der Ersteinrichtung in `config.sh` konfiguriert.
> Alle Skripte verwenden diese zentrale Konfiguration.

## Voraussetzungen

### Erforderlich

| Komponente | Mindestversion | Prüfen mit |
|------------|----------------|------------|
| **Linux** | Beliebig | `uname -a` |
| **Docker** | 20.10+ | `docker --version` |
| **Docker Compose** | v2.0+ | `docker compose version` |

### Optional

| Komponente | Verwendung |
|------------|------------|
| **Git** | GitHub/GitLab Integration |
| **Nginx Proxy Manager** | SSL & Domain-Verwaltung |

### Docker installieren (falls nicht vorhanden)

```bash
# Schnelle Installation (alle Distributionen)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Neu einloggen, damit die Gruppe aktiv wird!

# Oder manuell:
# Debian/Ubuntu:  sudo apt install docker.io docker-compose-plugin
# CentOS/Fedora:  sudo dnf install docker docker-compose-plugin
# Arch Linux:     sudo pacman -S docker docker-compose
```

> **Tipp**: Das `quick-start.sh` Script prüft automatisch ob Docker installiert ist.

## Installation

### 1. Dateien auf Server kopieren

Auf deinem **lokalen Rechner**:

```bash
# Von deinem lokalen Projekt-Verzeichnis aus
rsync -avz --exclude='.git' . <USER>@<SERVER_IP>:/opt/webserver/
# Beispiel: rsync -avz --exclude='.git' . mehmed@192.168.2.125:/opt/webserver/
```

### 2. Auf Server einloggen

```bash
ssh <USER>@<SERVER_IP>
cd /opt/webserver
```

### 3. Quick-Start ausführen (Empfohlen!)

```bash
chmod +x quick-start.sh
./quick-start.sh

# Das Script fragt nach:
# - Server IP-Adresse
# - Standard-Benutzer
# Erstellt config.sh und startet die Infrastruktur automatisch
```

### 4. Oder: Manuelle Konfiguration

```bash
# Server-Konfiguration erstellen
cp config.sh.example config.sh
nano config.sh
# SERVER_IP und DEFAULT_USER anpassen

# Scripts ausführbar machen
chmod +x scripts/*.sh

# Infrastructure .env erstellen
cd infrastructure
cp .env.example .env
nano .env
# WICHTIG: MYSQL_ROOT_PASSWORD ändern!
```

### 5. Infrastruktur starten

```bash
# Aus dem /opt/webserver Verzeichnis
./scripts/start-infrastructure.sh
```

Das startet:
- MariaDB auf Port 3306
- phpMyAdmin auf Port 8080

### 6. Überprüfen

```bash
# Container Status
docker ps

# Netzwerk prüfen
docker network ls | grep webserver

# MariaDB testen
docker exec -it webserver-mariadb mysql -uroot -p
```

## Erstes Projekt erstellen

### Interaktiver Weg (Empfohlen!)

```bash
cd /opt/webserver
./scripts/create-project.sh
```

Das Script fragt dich nach:
1. **Username** (Standard: mehmed)
2. **Projektname**
3. **Template-Auswahl:**
   - 1) Statische Website (HTML/CSS/JS)
   - 2) PHP Website (PHP + Nginx + Datenbank)
   - 3) Node.js App (Express + Datenbank)
4. **Port** (automatisch vorgeschlagen!)
5. **GitHub Repository** (optional)
6. **Datenbank erstellen?** (bei PHP/Node.js)
7. **Container direkt starten?**

**Vorteil:** Alles wird automatisch konfiguriert und ist sofort einsatzbereit!

### Klassischer Weg (mit Parametern)

```bash
cd /opt/webserver

# Statische Website
./scripts/create-project.sh mehmed beispiel-web static-website

# ODER PHP Website
./scripts/create-project.sh mehmed meine-php-site php-website

# ODER Node.js App
./scripts/create-project.sh mehmed nodejs-api nodejs-app
```

## Mit GitHub arbeiten

### Variante 1: Beim Projekt-Setup (Einfach!)

```bash
./scripts/create-project.sh

# Bei GitHub Repository URL:
git@github.com:username/repo.git

# Repository wird automatisch geklont
# Berechtigungen werden gesetzt
# Projekt ist sofort einsatzbereit
```

### Variante 2: Nachträglich hinzufügen

```bash
cd /opt/webserver/users/mehmed/PROJEKTNAME

# Bestehendes html-Verzeichnis löschen
rm -rf html

# GitHub-Repository klonen
git clone git@github.com:username/repo.git html

# Berechtigungen setzen
find html -type d -exec chmod 755 {} \;
find html -type f -exec chmod 644 {} \;

# Container neu starten
docker compose restart
```

### GitHub SSH-Key einrichten

```bash
# Public Key anzeigen
cat ~/.ssh/id_ed25519.pub

# Kopiere den Key und füge ihn auf GitHub hinzu:
# GitHub → Settings → SSH and GPG keys → New SSH key
```

## Best Practices & Quick Reference

Siehe vollständige Dokumentation in README.md

## Troubleshooting

### 403 Forbidden

**Lösung:**
```bash
cd /opt/webserver/users/mehmed/PROJEKTNAME
find html -type d -exec chmod 755 {} \;
find html -type f -exec chmod 644 {} \;
docker compose restart
```

### Port already in use

```bash
# Port in .env ändern
nano .env  # EXPOSED_PORT ändern
docker compose down
docker compose up -d
```

Weitere Troubleshooting-Tipps siehe README.md
