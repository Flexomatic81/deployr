# Git Workflow mit VS Code

Professioneller Workflow für die Webserver-Infrastruktur

## Übersicht

```
VS Code (lokal)
    ↓ git push
GitHub/GitLab
    ↓ git pull (via Script)
Server (192.168.2.125)
    ↓
Docker Container → Live Website
```

## 1. Erstes Projekt mit Git einrichten

### A. Lokal in VS Code

```bash
# 1. Projekt-Ordner erstellen
mkdir mein-projekt
cd mein-projekt

# 2. Initiale Dateien erstellen
echo "<!DOCTYPE html><html><body><h1>Mein Projekt</h1></body></html>" > index.html

# 3. Git initialisieren
git init
git add .
git commit -m "Initial commit"
```

### B. Repository erstellen

**GitHub**:
1. Auf GitHub.com einloggen
2. "New Repository" → Name: `mein-projekt`
3. **WICHTIG**: KEIN README, .gitignore oder License hinzufügen!

```bash
# Repository verknüpfen
git remote add origin https://github.com/dein-username/mein-projekt.git
git branch -M main
git push -u origin main
```

### C. Auf Server deployen

```bash
# SSH auf Server
ssh mehmed@192.168.2.125
cd /opt/webserver

# Projekt-Container erstellen
./scripts/create-project.sh demo mein-projekt static-website

# In HTML-Verzeichnis wechseln
cd users/demo/mein-projekt/html/

# Beispiel-Datei löschen
rm index.html

# Git Repository clonen
git clone https://github.com/dein-username/mein-projekt.git .

# Container starten
cd ..
docker compose up -d
```

✓ Dein Projekt läuft jetzt auf dem Server!

## 2. Täglicher Workflow

### In VS Code (lokal)

1. **Änderungen machen**
   - Dateien bearbeiten in VS Code

2. **Git Commit** (3 Wege):

   **Via VS Code GUI**:
   - Source Control Icon (links)
   - Geänderte Dateien sehen
   - "+" bei Dateien → Stage Changes
   - Commit Message eingeben
   - ✓ Commit klicken
   - ↑ Push klicken

   **Via VS Code Terminal**:
   ```bash
   git add .
   git commit -m "Beschreibung der Änderung"
   git push
   ```

   **Via Kommandozeile**:
   ```bash
   git add .
   git commit -m "Update: Navigation verbessert"
   git push
   ```

3. **Auf Server deployen**

   **Option A - Manuell**:
   ```bash
   ssh mehmed@192.168.2.125
   cd /opt/webserver
   ./scripts/git-deploy.sh demo mein-projekt
   ```

   **Option B - Automatisch (Lokales Script)**:
   ```bash
   # Einmalig: deploy.sh erstellen und anpassen
   chmod +x deploy.sh

   # Dann bei jeder Änderung:
   ./deploy.sh
   ```

## 3. Automatisches Deployment-Script

### Lokales Script erstellen

Erstelle `deploy.sh` in deinem Projekt-Root:

```bash
#!/bin/bash
set -e

SERVER="mehmed@192.168.2.125"
USER="demo"
PROJECT="mein-projekt"

echo "=== Deploying $PROJECT ==="

# Änderungen commiten (falls vorhanden)
if [[ -n $(git status -s) ]]; then
    git add .
    read -p "Commit message: " msg
    git commit -m "$msg"
fi

# Push zu GitHub
git push

# Deploy auf Server
ssh $SERVER "cd /opt/webserver && ./scripts/git-deploy.sh $USER $PROJECT"

echo "✓ Deployed!"
```

Ausführbar machen:
```bash
chmod +x deploy.sh
```

Verwenden:
```bash
./deploy.sh
```

## 4. VS Code Extensions (Empfohlen)

Installiere in VS Code:

1. **GitLens** - Bessere Git-Integration
2. **Git Graph** - Visueller Git-Verlauf
3. **Remote - SSH** - Direkt auf Server arbeiten
4. **Live Server** - Lokale Preview

## 5. Verschiedene Projekt-Typen

### Static Website (HTML/CSS/JS)

```bash
# Repository-Struktur
mein-projekt/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── images/

# Auf Server (static-website Template)
./scripts/create-project.sh demo projekt static-website
```

### PHP-Projekt

```bash
# Repository-Struktur
mein-php-projekt/
├── index.php
├── includes/
├── config.php
└── composer.json

# Auf Server (php-website Template)
./scripts/create-project.sh demo php-projekt php-website

# Datenbank erstellen
./scripts/create-database.sh demo php_projekt_db
```

### Node.js Projekt

```bash
# Repository-Struktur
mein-node-app/
├── package.json
├── server.js
├── public/
└── .gitignore

# WICHTIG: .gitignore für Node.js
echo "node_modules/" > .gitignore

# Auf Server (nodejs-app Template)
./scripts/create-project.sh demo node-app nodejs-app
```

## 6. Wichtige Git-Befehle

```bash
# Status prüfen
git status

# Änderungen sehen
git diff

# Commit-Historie
git log --oneline

# Letzten Commit rückgängig machen (lokal)
git reset HEAD~1

# Remote Updates holen (auf Server)
git pull

# Branch erstellen
git checkout -b feature-name

# Branch mergen
git checkout main
git merge feature-name

# Änderungen verwerfen
git checkout -- datei.html
```

## 7. .gitignore Beispiele

### Für alle Projekte

```gitignore
# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Env Files
.env
.env.local
```

### Zusätzlich für Node.js

```gitignore
node_modules/
npm-debug.log
package-lock.json
```

### Zusätzlich für PHP

```gitignore
vendor/
composer.lock
```

## 8. Troubleshooting

### Problem: "Permission denied" beim Push

```bash
# SSH-Key für GitHub einrichten
ssh-keygen -t ed25519 -C "deine-email@example.com"
cat ~/.ssh/id_ed25519.pub

# → Kopieren und in GitHub Settings → SSH Keys einfügen
```

### Problem: Merge Conflicts

```bash
# Auf Server
cd /opt/webserver/users/demo/projekt/html
git status  # Zeigt Konflikte

# Konflikte manuell beheben, dann:
git add .
git commit -m "Merge conflicts resolved"
```

### Problem: Container zeigt alte Version

```bash
# Browser-Cache leeren oder:
cd /opt/webserver/users/demo/projekt
docker compose restart
```

## 9. Fortgeschrittene Workflows

### GitHub Actions (CI/CD)

Erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: 192.168.2.125
          username: mehmed
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/webserver
            ./scripts/git-deploy.sh demo mein-projekt
```

### Webhooks (Auto-Deploy bei Push)

Für automatisches Deployment ohne manuellen Befehl - erfordert zusätzliches Setup auf dem Server.

## 10. Best Practices

✓ **Kleine, häufige Commits** - Nicht alle Änderungen auf einmal
✓ **Beschreibende Commit-Messages** - "Fix navigation bug" statt "fix"
✓ **Branches für Features** - Haupt-Branch bleibt stabil
✓ **Teste lokal** - Vor dem Push testen
✓ **Pull before Push** - Immer erst Updates holen
✓ **.gitignore verwenden** - Keine sensiblen Daten committen
✓ **README.md pflegen** - Dokumentiere dein Projekt

## Quick Reference

```bash
# Workflow in 3 Schritten
git add . && git commit -m "message" && git push
ssh mehmed@192.168.2.125 "cd /opt/webserver && ./scripts/git-deploy.sh demo projekt"

# Oder mit Script
./deploy.sh
```

## Zusammenfassung

1. **Entwickeln** in VS Code (lokal)
2. **Commit & Push** zu GitHub/GitLab
3. **Deploy** auf Server mit Script
4. **Live** über NPM auf deiner Domain

Einfach, professionell, versioniert!
