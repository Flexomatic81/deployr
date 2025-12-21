const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload-Verzeichnis erstellen falls nicht vorhanden
const uploadDir = process.env.UPLOAD_TEMP_PATH || '/tmp/dployr-uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
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
        // Nur ZIP-Dateien erlauben
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

module.exports = upload;
