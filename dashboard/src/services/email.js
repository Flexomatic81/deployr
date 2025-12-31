/**
 * Email service for sending transactional emails
 * Supports SMTP via nodemailer
 */

const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');

let transporter = null;

/**
 * Check if email is enabled
 */
function isEnabled() {
    return process.env.EMAIL_ENABLED === 'true';
}

/**
 * Get the email transporter (lazy initialization)
 */
function getTransporter() {
    if (!isEnabled()) {
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 10000      // 10 seconds
        });
    }

    return transporter;
}

/**
 * Reset transporter (for config changes)
 */
function resetTransporter() {
    transporter = null;
}

/**
 * Load and render email template
 * @param {string} templateName - Name of the template (without .ejs)
 * @param {object} data - Data to pass to the template
 * @param {string} language - Language code (de/en)
 */
async function renderTemplate(templateName, data, language = 'de') {
    const templatesDir = path.join(__dirname, '..', 'templates', 'emails');
    const templatePath = path.join(templatesDir, language, `${templateName}.ejs`);

    try {
        const template = await fs.readFile(templatePath, 'utf8');
        return ejs.render(template, data);
    } catch (error) {
        // Fallback to German if requested language not found
        if (language !== 'de') {
            const fallbackPath = path.join(templatesDir, 'de', `${templateName}.ejs`);
            try {
                const template = await fs.readFile(fallbackPath, 'utf8');
                return ejs.render(template, data);
            } catch (fallbackError) {
                logger.error('Email template not found', { templateName, language, error: fallbackError.message });
                throw new Error(`Email template not found: ${templateName}`);
            }
        }
        logger.error('Email template not found', { templateName, language, error: error.message });
        throw new Error(`Email template not found: ${templateName}`);
    }
}

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (optional, auto-generated from HTML if not provided)
 */
async function sendEmail(to, subject, html, text = null) {
    if (!isEnabled()) {
        logger.debug('Email not sent - email disabled', { to, subject });
        return { success: false, reason: 'disabled' };
    }

    const transport = getTransporter();
    if (!transport) {
        logger.error('Email transporter not configured');
        return { success: false, reason: 'not_configured' };
    }

    try {
        const result = await transport.sendMail({
            from: process.env.EMAIL_FROM || 'Dployr <noreply@localhost>',
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        });

        logger.info('Email sent successfully', { to, subject, messageId: result.messageId });
        return { success: true, messageId: result.messageId };
    } catch (error) {
        logger.error('Failed to send email', { to, subject, error: error.message });
        return { success: false, error: error.message };
    }
}

/**
 * Test email connection
 */
async function testConnection() {
    if (!isEnabled()) {
        return { success: false, error: 'Email is not enabled' };
    }

    const transport = getTransporter();
    if (!transport) {
        return { success: false, error: 'Transporter not configured' };
    }

    try {
        await transport.verify();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get base URL for email links
 */
function getBaseUrl() {
    // Prefer configured dashboard domain
    if (process.env.NPM_DASHBOARD_DOMAIN) {
        return `https://${process.env.NPM_DASHBOARD_DOMAIN}`;
    }
    const port = process.env.DASHBOARD_PORT || 3000;
    const serverIp = process.env.SERVER_IP || 'localhost';
    return `http://${serverIp}:${port}`;
}

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} token - Verification token
 * @param {string} language - User language
 */
async function sendVerificationEmail(email, username, token, language = 'de') {
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const html = await renderTemplate('verification', {
        username,
        verificationUrl,
        expiresIn: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES) || 24
    }, language);

    const subjects = {
        de: 'Dployr - E-Mail-Adresse bestätigen',
        en: 'Dployr - Verify your email address'
    };

    return sendEmail(email, subjects[language] || subjects.de, html);
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} token - Reset token
 * @param {string} language - User language
 */
async function sendPasswordResetEmail(email, username, token, language = 'de') {
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = await renderTemplate('password-reset', {
        username,
        resetUrl,
        expiresIn: parseInt(process.env.EMAIL_RESET_EXPIRES) || 1
    }, language);

    const subjects = {
        de: 'Dployr - Passwort zurücksetzen',
        en: 'Dployr - Reset your password'
    };

    return sendEmail(email, subjects[language] || subjects.de, html);
}

/**
 * Send account approval notification
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} language - User language
 */
async function sendApprovalEmail(email, username, language = 'de') {
    const baseUrl = getBaseUrl();
    const loginUrl = `${baseUrl}/login`;

    const html = await renderTemplate('account-approved', {
        username,
        loginUrl
    }, language);

    const subjects = {
        de: 'Dployr - Dein Konto wurde freigeschaltet',
        en: 'Dployr - Your account has been approved'
    };

    return sendEmail(email, subjects[language] || subjects.de, html);
}

/**
 * Send test email
 * @param {string} to - Recipient email
 * @param {string} language - User language
 */
async function sendTestEmail(to, language = 'de') {
    const subjects = {
        de: 'Dployr - Test-E-Mail',
        en: 'Dployr - Test Email'
    };

    const messages = {
        de: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Test-E-Mail</h2>
                <p>Diese E-Mail bestätigt, dass die E-Mail-Konfiguration korrekt funktioniert.</p>
                <p><strong>Dployr</strong></p>
            </div>
        `,
        en: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Test Email</h2>
                <p>This email confirms that the email configuration is working correctly.</p>
                <p><strong>Dployr</strong></p>
            </div>
        `
    };

    return sendEmail(to, subjects[language] || subjects.de, messages[language] || messages.de);
}

module.exports = {
    isEnabled,
    resetTransporter,
    sendEmail,
    testConnection,
    getBaseUrl,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendApprovalEmail,
    sendTestEmail
};
