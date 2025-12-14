# Projekt-Templates

Fertige Templates für verschiedene Projekt-Typen. Einfach kopieren und anpassen.

## Verfügbare Templates

### 1. **static-website**
Einfache statische Website (HTML/CSS/JS)
- Nginx Webserver
- Direkt über NPM erreichbar

### 2. **php-website**
PHP Website (z.B. WordPress, Laravel)
- Nginx + PHP-FPM
- MariaDB Anbindung
- Composer Support

### 3. **nodejs-app**
Node.js Anwendung (Express, Next.js, etc.)
- Node.js Runtime
- Environment Variables
- Automatischer Neustart

### 4. **python-app**
Python Web-App (Flask, Django, FastAPI)
- Python Runtime
- Virtual Environment
- WSGI Server (Gunicorn)

## Verwendung

1. Template in User-Verzeichnis kopieren:
   ```bash
   cp -r templates/static-website users/username/projektname
   ```

2. In Projekt-Verzeichnis wechseln und anpassen:
   ```bash
   cd users/username/projektname
   nano docker-compose.yml  # Ports, Namen anpassen
   ```

3. Container starten:
   ```bash
   docker-compose up -d
   ```

4. In NPM die Domain konfigurieren und auf den Container-Port weiterleiten
