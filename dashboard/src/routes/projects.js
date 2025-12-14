const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const projectService = require('../services/project');
const dockerService = require('../services/docker');

// Alle Projekte anzeigen
router.get('/', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const projects = await projectService.getUserProjects(systemUsername);

        res.render('projects/index', {
            title: 'Projekte',
            projects
        });
    } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error);
        req.flash('error', 'Fehler beim Laden der Projekte');
        res.redirect('/dashboard');
    }
});

// Neues Projekt erstellen - Formular
router.get('/create', requireAuth, async (req, res) => {
    try {
        const templates = await projectService.getAvailableTemplates();
        const nextPort = await projectService.getNextAvailablePort();

        res.render('projects/create', {
            title: 'Neues Projekt',
            templates,
            nextPort
        });
    } catch (error) {
        console.error('Fehler beim Laden des Formulars:', error);
        req.flash('error', 'Fehler beim Laden des Formulars');
        res.redirect('/projects');
    }
});

// Neues Projekt erstellen - Verarbeitung
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, template, port } = req.body;
        const systemUsername = req.session.user.system_username;

        const project = await projectService.createProject(
            systemUsername,
            name,
            template,
            { port: parseInt(port) }
        );

        req.flash('success', `Projekt "${name}" erfolgreich erstellt!`);
        res.redirect(`/projects/${name}`);
    } catch (error) {
        console.error('Fehler beim Erstellen des Projekts:', error);
        req.flash('error', error.message || 'Fehler beim Erstellen des Projekts');
        res.redirect('/projects/create');
    }
});

// Einzelnes Projekt anzeigen
router.get('/:name', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.name);

        if (!project) {
            req.flash('error', 'Projekt nicht gefunden');
            return res.redirect('/projects');
        }

        res.render('projects/show', {
            title: project.name,
            project
        });
    } catch (error) {
        console.error('Fehler beim Laden des Projekts:', error);
        req.flash('error', 'Fehler beim Laden des Projekts');
        res.redirect('/projects');
    }
});

// Projekt starten
router.post('/:name/start', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.name);

        if (!project) {
            req.flash('error', 'Projekt nicht gefunden');
            return res.redirect('/projects');
        }

        await dockerService.startProject(project.path);
        req.flash('success', `Projekt "${req.params.name}" gestartet`);
        res.redirect(`/projects/${req.params.name}`);
    } catch (error) {
        console.error('Fehler beim Starten:', error);
        req.flash('error', 'Fehler beim Starten: ' + error.message);
        res.redirect(`/projects/${req.params.name}`);
    }
});

// Projekt stoppen
router.post('/:name/stop', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.name);

        if (!project) {
            req.flash('error', 'Projekt nicht gefunden');
            return res.redirect('/projects');
        }

        await dockerService.stopProject(project.path);
        req.flash('success', `Projekt "${req.params.name}" gestoppt`);
        res.redirect(`/projects/${req.params.name}`);
    } catch (error) {
        console.error('Fehler beim Stoppen:', error);
        req.flash('error', 'Fehler beim Stoppen: ' + error.message);
        res.redirect(`/projects/${req.params.name}`);
    }
});

// Projekt neustarten
router.post('/:name/restart', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;
        const project = await projectService.getProjectInfo(systemUsername, req.params.name);

        if (!project) {
            req.flash('error', 'Projekt nicht gefunden');
            return res.redirect('/projects');
        }

        await dockerService.restartProject(project.path);
        req.flash('success', `Projekt "${req.params.name}" neugestartet`);
        res.redirect(`/projects/${req.params.name}`);
    } catch (error) {
        console.error('Fehler beim Neustarten:', error);
        req.flash('error', 'Fehler beim Neustarten: ' + error.message);
        res.redirect(`/projects/${req.params.name}`);
    }
});

// Projekt löschen
router.delete('/:name', requireAuth, async (req, res) => {
    try {
        const systemUsername = req.session.user.system_username;

        await projectService.deleteProject(systemUsername, req.params.name);
        req.flash('success', `Projekt "${req.params.name}" gelöscht`);
        res.redirect('/projects');
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        req.flash('error', 'Fehler beim Löschen: ' + error.message);
        res.redirect(`/projects/${req.params.name}`);
    }
});

module.exports = router;
