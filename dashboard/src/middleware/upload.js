const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../config/logger');

// Upload-Verzeichnis erstellen falls nicht vorhanden
const uploadDir = process.env.UPLOAD_TEMP_PATH || '/tmp/dployr-uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ZIP Magic Bytes: PK (0x50, 0x4B) gefolgt von 0x03, 0x04 (lokaler File Header)
// oder 0x05, 0x06 (End of Central Directory) oder 0x07, 0x08 (Spanned Archive)
const ZIP_MAGIC_BYTES = [
    [0x50, 0x4B, 0x03, 0x04], // Normaler ZIP-Header
    [0x50, 0x4B, 0x05, 0x06], // Leere ZIP-Datei
    [0x50, 0x4B, 0x07, 0x08]  // Spanned Archive
];

/**
 * Prüft ob eine Datei eine gültige ZIP-Datei ist anhand der Magic Bytes
 */
function isValidZipFile(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);

        // Prüfe gegen alle gültigen ZIP-Header
        return ZIP_MAGIC_BYTES.some(magic =>
            buffer[0] === magic[0] &&
            buffer[1] === magic[1] &&
            buffer[2] === magic[2] &&
            buffer[3] === magic[3]
        );
    } catch (error) {
        logger.warn('Fehler beim Prüfen der ZIP-Magic-Bytes', { error: error.message });
        return false;
    }
}

/**
 * Prüft ZIP-Datei auf gefährliche Inhalte
 */
function validateZipContents(filePath) {
    const AdmZip = require('adm-zip');
    const errors = [];

    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        // Gefährliche Dateiendungen
        const dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
            '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',
            '.ps1', '.psm1', '.psd1'
        ];

        // Prüfe auf Zip-Slip (Path Traversal)
        for (const entry of entries) {
            const entryName = entry.entryName;

            // Path Traversal prüfen
            if (entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('\\')) {
                errors.push(`Verdächtiger Pfad gefunden: ${entryName}`);
                continue;
            }

            // Gefährliche Dateien prüfen (nur warnen, nicht blockieren)
            const ext = path.extname(entryName).toLowerCase();
            if (dangerousExtensions.includes(ext)) {
                logger.warn('Potentiell gefährliche Datei in ZIP', {
                    file: entryName,
                    extension: ext
                });
            }

            // Sehr große Dateien prüfen (> 500MB entpackt)
            if (entry.header.size > 500 * 1024 * 1024) {
                errors.push(`Datei zu groß: ${entryName} (${Math.round(entry.header.size / 1024 / 1024)}MB)`);
            }
        }

        // Zip-Bomb Erkennung: Prüfe Kompressionsrate
        const stats = fs.statSync(filePath);
        const compressedSize = stats.size;
        let uncompressedSize = 0;

        for (const entry of entries) {
            uncompressedSize += entry.header.size;
        }

        // Warnung wenn Kompressionsrate > 100:1 (typisch für Zip-Bombs)
        if (compressedSize > 0 && uncompressedSize / compressedSize > 100) {
            errors.push(`Verdächtige Kompressionsrate: ${Math.round(uncompressedSize / compressedSize)}:1`);
        }

        // Maximal entpackte Größe: 1GB
        if (uncompressedSize > 1024 * 1024 * 1024) {
            errors.push(`Entpackte Größe zu groß: ${Math.round(uncompressedSize / 1024 / 1024)}MB (max. 1GB)`);
        }

    } catch (error) {
        errors.push(`ZIP-Datei konnte nicht gelesen werden: ${error.message}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Eindeutiger Dateiname mit Timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    },
    fileFilter: (req, file, cb) => {
        // Nur ZIP-Dateien erlauben (MIME-Type und Extension)
        const isZip = file.mimetype === 'application/zip' ||
                      file.mimetype === 'application/x-zip-compressed' ||
                      file.originalname.toLowerCase().endsWith('.zip');

        if (isZip) {
            cb(null, true);
        } else {
            cb(new Error('Nur ZIP-Dateien sind erlaubt'));
        }
    }
});

/**
 * Middleware die nach dem Upload die ZIP-Datei validiert
 */
function validateZipMiddleware(req, res, next) {
    if (!req.file) {
        return next();
    }

    const filePath = req.file.path;

    // 1. Magic Bytes prüfen
    if (!isValidZipFile(filePath)) {
        // Datei löschen
        try { fs.unlinkSync(filePath); } catch {}

        logger.warn('Ungültige ZIP-Datei hochgeladen (Magic Bytes)', {
            originalName: req.file.originalname,
            ip: req.ip
        });

        req.flash('error', 'Die hochgeladene Datei ist keine gültige ZIP-Datei');
        return res.redirect('back');
    }

    // 2. ZIP-Inhalte validieren
    const validation = validateZipContents(filePath);
    if (!validation.valid) {
        // Datei löschen
        try { fs.unlinkSync(filePath); } catch {}

        logger.warn('ZIP-Validierung fehlgeschlagen', {
            originalName: req.file.originalname,
            errors: validation.errors,
            ip: req.ip
        });

        req.flash('error', `ZIP-Datei ungültig: ${validation.errors.join(', ')}`);
        return res.redirect('back');
    }

    next();
}

module.exports = upload;
module.exports.validateZipMiddleware = validateZipMiddleware;
module.exports.isValidZipFile = isValidZipFile;
module.exports.validateZipContents = validateZipContents;
