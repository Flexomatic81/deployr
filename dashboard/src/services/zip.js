const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const gitService = require('./git');

const USERS_PATH = process.env.USERS_PATH || '/app/users';

/**
 * Entpackt eine ZIP-Datei in ein Zielverzeichnis
 */
function extractZip(zipPath, destPath) {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destPath, true);
}

/**
 * Prüft ob das Verzeichnis nur einen einzigen Unterordner enthält
 * und verschiebt dessen Inhalt nach oben (z.B. projekt-main/ -> .)
 */
function flattenIfNeeded(destPath) {
    const entries = fs.readdirSync(destPath);

    // Ignoriere versteckte Dateien wie .DS_Store
    const visibleEntries = entries.filter(e => !e.startsWith('.'));

    // Nur wenn genau ein Eintrag existiert und es ein Verzeichnis ist
    if (visibleEntries.length === 1) {
        const singleEntry = visibleEntries[0];
        const singleEntryPath = path.join(destPath, singleEntry);

        if (fs.statSync(singleEntryPath).isDirectory()) {
            console.log(`ZIP-Struktur: Verschiebe Inhalt von ${singleEntry}/ nach oben`);

            // Alle Dateien aus dem Unterordner verschieben
            const subEntries = fs.readdirSync(singleEntryPath);
            for (const entry of subEntries) {
                const src = path.join(singleEntryPath, entry);
                const dest = path.join(destPath, entry);
                fs.renameSync(src, dest);
            }

            // Leeren Unterordner löschen
            fs.rmdirSync(singleEntryPath);

            return true;
        }
    }

    return false;
}

/**
 * Erstellt ein neues Projekt aus einer ZIP-Datei
 */
async function createProjectFromZip(systemUsername, projectName, zipPath, port) {
    const projectPath = path.join(USERS_PATH, systemUsername, projectName);

    // Prüfen ob Projekt bereits existiert
    if (fs.existsSync(projectPath)) {
        // ZIP-Datei löschen
        cleanupZip(zipPath);
        throw new Error('Ein Projekt mit diesem Namen existiert bereits');
    }

    try {
        // User-Verzeichnis erstellen
        const userPath = path.join(USERS_PATH, systemUsername);
        fs.mkdirSync(userPath, { recursive: true });

        // Projekt-Verzeichnis erstellen
        fs.mkdirSync(projectPath, { recursive: true });

        // ZIP entpacken
        console.log(`Entpacke ZIP nach ${projectPath}`);
        extractZip(zipPath, projectPath);

        // Prüfen ob nur ein Unterordner existiert und ggf. flatten
        flattenIfNeeded(projectPath);

        // Projekttyp erkennen (nutzt git.js Funktion)
        const projectType = gitService.detectProjectType(projectPath);
        console.log(`Erkannter Projekttyp: ${projectType}`);

        // docker-compose.yml generieren (nutzt git.js Funktion)
        const dockerCompose = gitService.generateDockerCompose(
            projectType,
            `${systemUsername}-${projectName}`,
            port
        );
        fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), dockerCompose);

        // .env generieren
        const envContent = `PROJECT_NAME=${systemUsername}-${projectName}\nEXPOSED_PORT=${port}\n`;
        fs.writeFileSync(path.join(projectPath, '.env'), envContent);

        // nginx-Config für statische Websites
        if (projectType === 'static') {
            const nginxDir = path.join(projectPath, 'nginx');
            fs.mkdirSync(nginxDir, { recursive: true });
            fs.writeFileSync(
                path.join(nginxDir, 'default.conf'),
                generateNginxConfig()
            );
        }

        // ZIP-Datei löschen
        cleanupZip(zipPath);

        return {
            success: true,
            projectType,
            path: projectPath,
            port
        };

    } catch (error) {
        // Aufräumen bei Fehler
        try {
            fs.rmSync(projectPath, { recursive: true, force: true });
        } catch {}

        cleanupZip(zipPath);

        throw error;
    }
}

/**
 * Löscht die temporäre ZIP-Datei
 */
function cleanupZip(zipPath) {
    try {
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
    } catch (error) {
        console.error('Fehler beim Löschen der ZIP-Datei:', error.message);
    }
}

/**
 * Generiert nginx default.conf für statische Websites
 * (Kopie von git.js für Unabhängigkeit)
 */
function generateNginxConfig() {
    return `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html index.htm;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}`;
}

module.exports = {
    createProjectFromZip,
    extractZip,
    flattenIfNeeded
};
