const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const gitService = require('./git');
const { generateNginxConfig } = require('./utils/nginx');
const { logger } = require('../config/logger');

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
            logger.debug('ZIP-Struktur: Verschiebe Inhalt nach oben', { folder: singleEntry });

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
        logger.info('Entpacke ZIP', { projectPath });
        extractZip(zipPath, projectPath);

        // Prüfen ob nur ein Unterordner existiert und ggf. flatten
        flattenIfNeeded(projectPath);

        // Projekttyp erkennen (nutzt git.js Funktion)
        const projectType = gitService.detectProjectType(projectPath);
        logger.info('Projekttyp erkannt', { projectType });

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
        logger.warn('Fehler beim Löschen der ZIP-Datei', { error: error.message });
    }
}

module.exports = {
    createProjectFromZip,
    extractZip,
    flattenIfNeeded
};
