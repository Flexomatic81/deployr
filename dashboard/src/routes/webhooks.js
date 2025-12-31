/**
 * Webhook endpoint for Git providers (GitHub, GitLab, Bitbucket)
 * Handles push events to trigger automatic deployments
 */
const express = require('express');
const router = express.Router();
const { logger } = require('../config/logger');
const autoDeployService = require('../services/autodeploy');
const {
    validateWebhookSignature,
    detectProvider,
    isPushEvent,
    extractBranch,
    extractCommitInfo
} = require('../services/utils/webhook');

/**
 * POST /api/webhooks/:webhookId
 * Receives webhook from Git providers
 */
router.post('/:webhookId', express.raw({ type: '*/*' }), async (req, res) => {
    const { webhookId } = req.params;

    // Validate webhookId is numeric
    if (!/^\d+$/.test(webhookId)) {
        logger.warn('[Webhook] Invalid webhook ID format', { webhookId });
        return res.status(400).json({ error: 'Invalid webhook ID' });
    }

    try {
        // Find project by webhook ID
        const project = await autoDeployService.findProjectByWebhook(parseInt(webhookId, 10));

        if (!project) {
            logger.warn('[Webhook] Project not found or webhook disabled', { webhookId });
            return res.status(404).json({ error: 'Webhook not found or disabled' });
        }

        // Get raw body for signature validation
        const rawBody = req.body;
        const headers = {};

        // Normalize headers to lowercase
        for (const [key, value] of Object.entries(req.headers)) {
            headers[key.toLowerCase()] = value;
        }

        // Detect provider from headers
        const provider = detectProvider(headers);
        if (!provider) {
            logger.warn('[Webhook] Unknown provider', { webhookId, headers: Object.keys(headers) });
            return res.status(400).json({ error: 'Unknown webhook provider' });
        }

        // Validate signature
        const isValid = validateWebhookSignature(provider, rawBody, headers, project.webhook_secret);
        if (!isValid) {
            logger.warn('[Webhook] Invalid signature', { webhookId, provider });
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Check if this is a push event
        if (!isPushEvent(provider, headers)) {
            logger.debug('[Webhook] Ignoring non-push event', { webhookId, provider });
            return res.status(200).json({ message: 'Event ignored (not a push)' });
        }

        // Parse payload
        let payload;
        try {
            payload = JSON.parse(rawBody.toString('utf-8'));
        } catch (e) {
            logger.warn('[Webhook] Invalid JSON payload', { webhookId, error: e.message });
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }

        // Extract branch from payload
        const branch = extractBranch(provider, payload);
        if (!branch) {
            logger.warn('[Webhook] Could not extract branch', { webhookId, provider });
            return res.status(400).json({ error: 'Could not determine branch' });
        }

        // Check if branch matches configured branch
        if (branch !== project.branch) {
            logger.debug('[Webhook] Branch mismatch, ignoring', {
                webhookId,
                receivedBranch: branch,
                configuredBranch: project.branch
            });
            return res.status(200).json({
                message: 'Branch ignored',
                received: branch,
                configured: project.branch
            });
        }

        // Extract commit info for logging
        const commitInfo = extractCommitInfo(provider, payload);
        logger.info('[Webhook] Triggering deployment', {
            webhookId,
            provider,
            branch,
            project: project.project_name,
            commit: commitInfo.hash?.substring(0, 7)
        });

        // Execute deployment (async, don't wait for completion)
        autoDeployService.executeDeploy(
            project.user_id,
            project.system_username,
            project.project_name,
            'webhook'
        ).then(result => {
            if (result.success) {
                logger.info('[Webhook] Deployment completed', {
                    webhookId,
                    project: project.project_name,
                    hasChanges: result.hasChanges
                });
            } else if (result.skipped) {
                logger.info('[Webhook] Deployment skipped (already in progress)', {
                    webhookId,
                    project: project.project_name
                });
            } else {
                logger.error('[Webhook] Deployment failed', {
                    webhookId,
                    project: project.project_name,
                    error: result.error
                });
            }
        }).catch(err => {
            logger.error('[Webhook] Deployment error', {
                webhookId,
                project: project.project_name,
                error: err.message
            });
        });

        // Return immediately (deployment runs async)
        return res.status(202).json({
            message: 'Deployment triggered',
            project: project.project_name,
            branch,
            commit: commitInfo.hash?.substring(0, 7)
        });

    } catch (error) {
        logger.error('[Webhook] Processing error', { webhookId, error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
