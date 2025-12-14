const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { redirectIfAuth, requireAuth } = require('../middleware/auth');

// Login-Seite anzeigen
router.get('/login', redirectIfAuth, (req, res) => {
    res.render('login', { title: 'Login' });
});

// Login verarbeiten
router.post('/login', redirectIfAuth, async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM dashboard_users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            req.flash('error', 'Ungültiger Benutzername oder Passwort');
            return res.redirect('/login');
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            req.flash('error', 'Ungültiger Benutzername oder Passwort');
            return res.redirect('/login');
        }

        // Session erstellen
        req.session.user = {
            id: user.id,
            username: user.username,
            system_username: user.system_username,
            is_admin: user.is_admin
        };

        req.flash('success', `Willkommen zurück, ${user.username}!`);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login-Fehler:', error);
        req.flash('error', 'Ein Fehler ist aufgetreten');
        res.redirect('/login');
    }
});

// Registrierungs-Seite anzeigen
router.get('/register', redirectIfAuth, (req, res) => {
    res.render('register', { title: 'Registrieren' });
});

// Registrierung verarbeiten
router.post('/register', redirectIfAuth, async (req, res) => {
    const { username, password, password_confirm, system_username } = req.body;

    // Validierung
    if (!username || !password || !system_username) {
        req.flash('error', 'Alle Felder müssen ausgefüllt werden');
        return res.redirect('/register');
    }

    if (password !== password_confirm) {
        req.flash('error', 'Passwörter stimmen nicht überein');
        return res.redirect('/register');
    }

    if (password.length < 6) {
        req.flash('error', 'Passwort muss mindestens 6 Zeichen lang sein');
        return res.redirect('/register');
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
        req.flash('error', 'Benutzername darf nur Kleinbuchstaben, Zahlen, - und _ enthalten');
        return res.redirect('/register');
    }

    if (!/^[a-z0-9_-]+$/.test(system_username)) {
        req.flash('error', 'System-Benutzername darf nur Kleinbuchstaben, Zahlen, - und _ enthalten');
        return res.redirect('/register');
    }

    try {
        // Prüfen ob Username bereits existiert
        const [existing] = await pool.execute(
            'SELECT id FROM dashboard_users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            req.flash('error', 'Benutzername bereits vergeben');
            return res.redirect('/register');
        }

        // Passwort hashen
        const password_hash = await bcrypt.hash(password, 12);

        // User erstellen
        const [result] = await pool.execute(
            'INSERT INTO dashboard_users (username, password_hash, system_username) VALUES (?, ?, ?)',
            [username, password_hash, system_username]
        );

        req.flash('success', 'Registrierung erfolgreich! Bitte einloggen.');
        res.redirect('/login');
    } catch (error) {
        console.error('Registrierungs-Fehler:', error);
        req.flash('error', 'Ein Fehler ist aufgetreten');
        res.redirect('/register');
    }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout-Fehler:', err);
        }
        res.redirect('/login');
    });
});

// GET Route für Logout (Fallback)
router.get('/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout-Fehler:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
