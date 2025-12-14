// Middleware: Prüft ob User eingeloggt ist
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    req.flash('error', 'Bitte zuerst einloggen');
    res.redirect('/login');
}

// Middleware: Prüft ob User Admin ist
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.is_admin) {
        return next();
    }
    req.flash('error', 'Admin-Berechtigung erforderlich');
    res.redirect('/dashboard');
}

// Middleware: Redirect wenn bereits eingeloggt
function redirectIfAuth(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

// Middleware: User-Daten für Views verfügbar machen
function setUserLocals(req, res, next) {
    res.locals.user = req.session ? req.session.user : null;
    res.locals.isAuthenticated = !!(req.session && req.session.user);
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    redirectIfAuth,
    setUserLocals
};
