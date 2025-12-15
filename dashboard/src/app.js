require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const path = require('path');

const { initDatabase } = require('./config/database');
const { setUserLocals } = require('./middleware/auth');

// Routes importieren
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const projectRoutes = require('./routes/projects');
const logRoutes = require('./routes/logs');
const databaseRoutes = require('./routes/databases');
const setupRoutes = require('./routes/setup');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    }
}));

// Flash Messages
app.use(flash());

// User Locals für Views
app.use(setUserLocals);

// Flash Messages für Views verfügbar machen
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Setup Route (vor anderen Routes, ohne Setup-Check)
app.use('/setup', setupRoutes);

// Setup-Check Middleware für alle anderen Routes
app.use(async (req, res, next) => {
    // Setup-Route überspringen
    if (req.path.startsWith('/setup')) {
        return next();
    }

    try {
        const { isSetupComplete } = require('./routes/setup');
        const setupComplete = await isSetupComplete();

        if (!setupComplete) {
            return res.redirect('/setup');
        }
        next();
    } catch (error) {
        // Bei Fehler (z.B. DB nicht erreichbar) zum Setup weiterleiten
        console.log('Setup-Check Fehler, leite zum Setup weiter:', error.message);
        return res.redirect('/setup');
    }
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/projects', projectRoutes);
app.use('/logs', logRoutes);
app.use('/databases', databaseRoutes);
app.use('/admin', adminRoutes);

// Home Route
app.get('/', async (req, res) => {
    try {
        const { isSetupComplete } = require('./routes/setup');
        const setupComplete = await isSetupComplete();

        if (!setupComplete) {
            return res.redirect('/setup');
        }

        if (req.session && req.session.user) {
            res.redirect('/dashboard');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        res.redirect('/setup');
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Nicht gefunden',
        message: 'Die angeforderte Seite wurde nicht gefunden.'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Fehler',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ein Fehler ist aufgetreten.'
    });
});

// Server starten
async function start() {
    try {
        // Prüfen ob Setup abgeschlossen ist
        const { isSetupComplete } = require('./routes/setup');
        const setupComplete = await isSetupComplete();

        if (setupComplete) {
            // Datenbank initialisieren nur wenn Setup fertig
            await initDatabase();
            console.log('Setup bereits abgeschlossen - Normalmodus');
        } else {
            console.log('Setup noch nicht abgeschlossen - Setup-Wizard aktiv');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Dashboard läuft auf http://0.0.0.0:${PORT}`);
            if (!setupComplete) {
                console.log('Öffne im Browser: http://<SERVER-IP>:3000/setup');
            }
        });
    } catch (error) {
        // Bei DB-Fehler trotzdem starten (für Setup-Wizard)
        console.log('Starte im Setup-Modus (DB nicht verfügbar)');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Dashboard läuft auf http://0.0.0.0:${PORT}`);
            console.log('Öffne im Browser: http://<SERVER-IP>:3000/setup');
        });
    }
}

start();
