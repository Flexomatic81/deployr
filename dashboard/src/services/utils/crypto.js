/**
 * Kryptografische Utility-Funktionen
 * Zentrale Stelle für sichere Zufallsgenerierung
 */

const crypto = require('crypto');

/**
 * Generiert ein sicheres zufälliges Passwort
 * @param {number} length - Länge des Passworts (Standard: 16)
 * @returns {string} Sicheres Passwort
 */
function generatePassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length).replace(/[+/=]/g, 'x');
}

module.exports = {
    generatePassword
};
