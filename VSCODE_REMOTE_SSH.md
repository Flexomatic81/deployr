# VS Code Remote SSH - Setup

Die beste Methode um direkt auf dem Server zu arbeiten.

> **Hinweis**: Die Server-IP ist in `config.sh` konfiguriert. Ersetze `<SERVER_IP>` mit deiner IP.

## Was ist VS Code Remote SSH?

- Öffne den Server direkt in VS Code
- Bearbeite Dateien als wären sie lokal
- Keine Synchronisation nötig
- Terminal direkt auf dem Server
- Alle VS Code Features funktionieren

## Setup (5 Minuten)

### 1. Extension installieren

1. VS Code öffnen
2. Extensions (Ctrl+Shift+X)
3. Suche: "Remote - SSH"
4. Installieren (von Microsoft)

### 2. Verbindung einrichten

**Methode 1: Via Command Palette (einfach)**

1. `Ctrl+Shift+P` (oder `Cmd+Shift+P` auf Mac)
2. Tippe: "Remote-SSH: Connect to Host"
3. Eingeben: `<USER>@<SERVER_IP>` (z.B. `mehmed@192.168.2.125`)
4. Enter drücken
5. Passwort/SSH-Key eingeben
6. Fertig!

**Methode 2: Via Config (professionell)**

1. `Ctrl+Shift+P` → "Remote-SSH: Open SSH Configuration File"
2. Wähle: `~/.ssh/config` (oder erstelle es)
3. Füge hinzu:

```ssh
Host webserver
    HostName <SERVER_IP>
    User <USER>
    IdentityFile ~/.ssh/id_rsa
```

> Ersetze `<SERVER_IP>` und `<USER>` mit deinen Werten aus `config.sh`

4. Speichern
5. `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
6. Wähle: "webserver"
7. Fertig!

### 3. Ordner öffnen

Nach der Verbindung:
1. File → Open Folder
2. Eingeben: `/opt/webserver`
3. Enter

Jetzt arbeitest Du direkt auf dem Server!

## Verwendung

### Dateien bearbeiten

Einfach im Explorer (links) auf Dateien klicken:
- `scripts/create-project.sh` bearbeiten
- `templates/static-website/html/index.html` anpassen
- Änderungen sind **sofort live** auf dem Server

### Terminal verwenden

1. Terminal → New Terminal (`Ctrl+ö` oder `Ctrl+~`)
2. Du bist bereits in `/opt/webserver`

```bash
# Scripts ausführen
./scripts/create-project.sh demo test static-website

# Container verwalten
cd users/demo/test
docker compose logs -f

# Git-Befehle
cd users/demo/meinprojekt/html
git pull
```

### Mehrere Dateien gleichzeitig

- Split Editor: Rechtsklick auf Tab → "Split Right"
- Oder: `Ctrl+\`
- Nebeneinander arbeiten

## Vorteile

✓ **Keine Synchronisation** - Dateien sind direkt auf dem Server
✓ **Schnell** - Änderungen sofort live
✓ **Einfach** - Wie lokale Entwicklung
✓ **Terminal** - Direkt auf dem Server
✓ **Git** - VS Code Git-Integration funktioniert
✓ **Extensions** - Alle VS Code Extensions verfügbar

## Typische Workflows

### Script bearbeiten

1. In VS Code Remote: `scripts/create-project.sh` öffnen
2. Änderungen machen
3. Speichern (`Ctrl+S`)
4. Terminal: `./scripts/create-project.sh test projekt static-website`
5. Testen
6. Fertig!

### Projekt entwickeln

1. In VS Code Remote: `/opt/webserver/users/demo/meinprojekt/html/` öffnen
2. `index.html` bearbeiten
3. Speichern
4. Browser: `http://<SERVER_IP>:PORT` neu laden
5. Änderungen sehen

### Mit Git arbeiten

1. In VS Code Remote: Projekt-Ordner öffnen
2. Source Control Icon (links)
3. Änderungen sehen
4. Commit & Push
5. Fertig - kein Deployment nötig!

## Extensions empfohlen

Nach dem Verbinden, installiere auf dem Server:

- **GitLens** - Bessere Git-Integration
- **Docker** - Container verwalten
- **PHP Intelephense** - Für PHP-Projekte
- **ESLint** - Für JavaScript-Projekte

## Tipps & Tricks

### Mehrere Server

Füge mehrere Hosts in `~/.ssh/config` hinzu:

```ssh
Host webserver
    HostName <SERVER_IP>
    User <USER>

Host production
    HostName <PROD_IP>
    User deploy
```

### Auto-Save aktivieren

File → Auto Save aktivieren
→ Änderungen werden automatisch gespeichert

### Terminal Split

Terminal → Split Terminal
→ Mehrere Terminals gleichzeitig

### SSH-Key statt Passwort

1. Lokal SSH-Key generieren (falls noch nicht):
```bash
ssh-keygen -t ed25519
```

2. Zum Server kopieren:
```bash
ssh-copy-id <USER>@<SERVER_IP>
```

3. Keine Passwort-Eingabe mehr nötig!

## Troubleshooting

### "Could not establish connection"

- Prüfe SSH-Verbindung: `ssh <USER>@<SERVER_IP>`
- Firewall?
- SSH-Service läuft?

### "VS Code Server failed to start"

- Server-Festplatte voll?
- Berechtigungen: `ls -la ~/.vscode-server`

### Langsame Verbindung

- In `~/.ssh/config`:
```ssh
Host webserver
    HostName <SERVER_IP>
    User <USER>
    Compression yes
    ServerAliveInterval 60
```

## Alternative: Remote Explorer

1. Remote Explorer Icon (links)
2. SSH Targets
3. Klick auf "webserver"
4. Ordner auswählen

## Zusammenfassung

**Statt:**
- Lokal arbeiten → Git push → SSH → Deploy

**Jetzt:**
- Direkt auf Server arbeiten → Speichern → Fertig!

Viel einfacher! 🚀
