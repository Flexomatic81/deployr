const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const projectService = require('../services/project');
const dockerService = require('../services/docker');

// Logs für ein Projekt anzeigen
router.get('/:projectName', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.projectName);

        if (!project) {
            req.flash('error', 'Projekt nicht gefunden');
            return res.redirect('/projects');
        }

        // Logs für alle Container des Projekts sammeln
        const containerLogs = [];

        for (const container of project.containers) {
            const logs = await dockerService.getContainerLogs(container.Id, 200);
            containerLogs.push({
                name: container.Names[0].replace('/', ''),
                state: container.State,
                logs
            });
        }

        res.render('logs', {
            title: `Logs - ${project.name}`,
            project,
            containerLogs,
            lines: 200
        });
    } catch (error) {
        console.error('Fehler beim Laden der Logs:', error);
        req.flash('error', 'Fehler beim Laden der Logs');
        res.redirect('/projects');
    }
});

// API: Logs als JSON abrufen (für Auto-Refresh)
router.get('/:projectName/api', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.projectName);

        if (!project) {
            return res.status(404).json({ error: 'Projekt nicht gefunden' });
        }

        const lines = parseInt(req.query.lines) || 100;
        const containerLogs = [];

        for (const container of project.containers) {
            const logs = await dockerService.getContainerLogs(container.Id, lines);
            containerLogs.push({
                name: container.Names[0].replace('/', ''),
                state: container.State,
                logs
            });
        }

        res.json({ containerLogs });
    } catch (error) {
        console.error('API Log-Fehler:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
