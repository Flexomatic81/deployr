const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const projectService = require('../services/project');
const databaseService = require('../services/database');

// Dashboard Hauptseite
router.get('/', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;

        // Projekte laden
        const projects = await projectService.getUserProjects(systemUsername);

        // Datenbanken laden
        const databases = await databaseService.getUserDatabases(systemUsername);

        // Statistiken berechnen
        const stats = {
            totalProjects: projects.length,
            runningProjects: projects.filter(p => p.status === 'running').length,
            stoppedProjects: projects.filter(p => p.status === 'stopped').length,
            totalDatabases: databases.length
        };

        res.render('dashboard', {
            title: 'Dashboard',
            projects,
            databases,
            stats
        });
    } catch (error) {
        console.error('Dashboard-Fehler:', error);
        req.flash('error', 'Fehler beim Laden des Dashboards');
        res.render('dashboard', {
            title: 'Dashboard',
            projects: [],
            databases: [],
            stats: { totalProjects: 0, runningProjects: 0, stoppedProjects: 0, totalDatabases: 0 }
        });
    }
});

module.exports = router;
