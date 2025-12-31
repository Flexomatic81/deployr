/**
 * Webhook validation utilities
 * Handles signature verification for GitHub, GitLab, and Bitbucket webhooks
 */
const crypto = require('crypto');

/**
 * Generates a secure webhook secret
 * @returns {string} 32-byte hex string (64 characters)
 */
function generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates GitHub webhook signature (HMAC-SHA256)
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function validateGitHubSignature(payload, signature, secret) {
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (e) {
        // Buffers have different lengths
        return false;
    }
}

/**
 * Validates GitLab webhook token (plain comparison)
 * @param {string} token - X-Gitlab-Token header value
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether token matches
 */
function validateGitLabToken(token, secret) {
    if (!token || !secret) return false;

    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(secret)
        );
    } catch (e) {
        return false;
    }
}

/**
 * Validates Bitbucket webhook signature (HMAC-SHA256)
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - X-Hub-Signature header value
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function validateBitbucketSignature(payload, signature, secret) {
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (e) {
        return false;
    }
}

/**
 * Detects webhook provider from headers
 * @param {Object} headers - Request headers (lowercase keys)
 * @returns {string|null} Provider name or null
 */
function detectProvider(headers) {
    if (headers['x-github-event']) return 'github';
    if (headers['x-gitlab-event']) return 'gitlab';
    if (headers['x-event-key']) return 'bitbucket';
    return null;
}

/**
 * Validates webhook signature based on provider
 * @param {string} provider - Provider name
 * @param {Buffer} payload - Raw request body
 * @param {Object} headers - Request headers (lowercase keys)
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function validateWebhookSignature(provider, payload, headers, secret) {
    switch (provider) {
        case 'github':
            return validateGitHubSignature(
                payload,
                headers['x-hub-signature-256'],
                secret
            );
        case 'gitlab':
            return validateGitLabToken(headers['x-gitlab-token'], secret);
        case 'bitbucket':
            return validateBitbucketSignature(
                payload,
                headers['x-hub-signature'],
                secret
            );
        default:
            return false;
    }
}

/**
 * Checks if the event is a push event
 * @param {string} provider - Provider name
 * @param {Object} headers - Request headers (lowercase keys)
 * @returns {boolean} Whether this is a push event
 */
function isPushEvent(provider, headers) {
    switch (provider) {
        case 'github':
            return headers['x-github-event'] === 'push';
        case 'gitlab':
            return headers['x-gitlab-event'] === 'Push Hook';
        case 'bitbucket':
            return headers['x-event-key'] === 'repo:push';
        default:
            return false;
    }
}

/**
 * Extracts branch name from webhook payload
 * @param {string} provider - Provider name
 * @param {Object} payload - Parsed JSON payload
 * @returns {string|null} Branch name or null
 */
function extractBranch(provider, payload) {
    switch (provider) {
        case 'github':
        case 'gitlab':
            // refs/heads/main -> main
            if (payload.ref && payload.ref.startsWith('refs/heads/')) {
                return payload.ref.replace('refs/heads/', '');
            }
            return payload.ref || null;
        case 'bitbucket':
            // Bitbucket has different structure
            const changes = payload.push?.changes;
            if (changes && changes.length > 0) {
                return changes[0]?.new?.name || null;
            }
            return null;
        default:
            return null;
    }
}

/**
 * Extracts commit information from webhook payload
 * @param {string} provider - Provider name
 * @param {Object} payload - Parsed JSON payload
 * @returns {Object} Commit info { hash, message }
 */
function extractCommitInfo(provider, payload) {
    switch (provider) {
        case 'github':
            return {
                hash: payload.after || null,
                message: payload.head_commit?.message || null
            };
        case 'gitlab':
            return {
                hash: payload.after || payload.checkout_sha || null,
                message: payload.commits?.[0]?.message || null
            };
        case 'bitbucket':
            const changes = payload.push?.changes;
            if (changes && changes.length > 0) {
                const newCommit = changes[0]?.new;
                return {
                    hash: newCommit?.target?.hash || null,
                    message: newCommit?.target?.message || null
                };
            }
            return { hash: null, message: null };
        default:
            return { hash: null, message: null };
    }
}

module.exports = {
    generateWebhookSecret,
    validateGitHubSignature,
    validateGitLabToken,
    validateBitbucketSignature,
    validateWebhookSignature,
    detectProvider,
    isPushEvent,
    extractBranch,
    extractCommitInfo
};
