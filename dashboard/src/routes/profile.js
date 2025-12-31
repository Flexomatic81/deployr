const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const userService = require('../services/user');
const emailService = require('../services/email');
const { logger } = require('../config/logger');

// All profile routes require authentication
router.use(requireAuth);

// Profile overview / Notification settings
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await userService.getFullUserById(userId);
        const prefs = await userService.getNotificationPreferences(userId);
        const emailEnabled = emailService.isEnabled();

        res.render('profile/notifications', {
            title: req.t('profile:notifications.title'),
            user,
            prefs,
            emailEnabled
        });
    } catch (error) {
        logger.error('Error loading notification settings', { error: error.message });
        req.flash('error', req.t('common:errors.loadError'));
        res.redirect('/dashboard');
    }
});

// Save notification settings
router.post('/notifications', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { notify_deploy_success, notify_deploy_failure, notify_autodeploy } = req.body;

        await userService.updateNotificationPreferences(userId, {
            deploySuccess: notify_deploy_success === 'on',
            deployFailure: notify_deploy_failure === 'on',
            autodeploy: notify_autodeploy === 'on'
        });

        logger.info('Notification preferences updated', { userId });
        req.flash('success', req.t('profile:notifications.saved'));
        res.redirect('/profile/notifications');
    } catch (error) {
        logger.error('Error saving notification settings', { error: error.message });
        req.flash('error', req.t('common:errors.saveError'));
        res.redirect('/profile/notifications');
    }
});

module.exports = router;
