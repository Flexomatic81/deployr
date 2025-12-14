# User-Projekte

Hier werden alle User-Projekte organisiert.

## Struktur

```
users/
├── user1/
│   ├── .db-credentials         # Automatisch generierte DB-Credentials
│   ├── projekt1/
│   │   ├── docker-compose.yml
│   │   ├── .env
│   │   └── ...
│   └── projekt2/
└── user2/
    └── projekt1/
```

## Neues Projekt erstellen

```bash
# 1. Projekt aus Template erstellen
./scripts/create-user.sh username projektname static-website

# 2. (Optional) Datenbank erstellen
./scripts/create-database.sh username projektname_db

# 3. .env Datei anpassen
cd users/username/projektname
nano .env

# 4. Container starten
docker-compose up -d

# 5. In NPM konfigurieren
# Domain -> 192.168.2.125:EXPOSED_PORT
```

## Projekt verwalten

```bash
# Status prüfen
cd users/username/projektname
docker-compose ps

# Logs anschauen
docker-compose logs -f

# Container neu starten
docker-compose restart

# Container stoppen
docker-compose down

# Container neu bauen
docker-compose up -d --build
```

## Alle Projekte auflisten

```bash
./scripts/list-projects.sh
```

## Wichtige Hinweise

- Jedes Projekt braucht einen **eigenen Port** (EXPOSED_PORT in .env)
- Alle Projekte sind im **webserver-network** verbunden
- MariaDB ist über **webserver-mariadb:3306** erreichbar (im Docker Network)
- DB-Credentials werden automatisch in `.db-credentials` gespeichert
