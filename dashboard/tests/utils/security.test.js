/**
 * Security utilities tests
 */

const fs = require('fs');
const path = require('path');

// Mock logger
jest.mock('../../src/config/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    }
}));

const { sanitizeReturnUrl, removeBlockedFiles } = require('../../src/services/utils/security');

describe('Security Utils', () => {
    describe('sanitizeReturnUrl', () => {
        const fallback = '/default';

        describe('valid local paths', () => {
            it('should allow simple local paths', () => {
                expect(sanitizeReturnUrl('/projects', fallback)).toBe('/projects');
                expect(sanitizeReturnUrl('/backups', fallback)).toBe('/backups');
                expect(sanitizeReturnUrl('/dashboard', fallback)).toBe('/dashboard');
            });

            it('should allow paths with segments', () => {
                expect(sanitizeReturnUrl('/projects/my-project', fallback)).toBe('/projects/my-project');
                expect(sanitizeReturnUrl('/admin/settings/npm', fallback)).toBe('/admin/settings/npm');
            });

            it('should allow paths with underscores and hyphens', () => {
                expect(sanitizeReturnUrl('/projects/my_project', fallback)).toBe('/projects/my_project');
                expect(sanitizeReturnUrl('/test-project/backups', fallback)).toBe('/test-project/backups');
            });

            it('should allow root path', () => {
                expect(sanitizeReturnUrl('/', fallback)).toBe('/');
            });
        });

        describe('malicious URLs - Open Redirect attacks', () => {
            it('should block absolute URLs with protocol', () => {
                expect(sanitizeReturnUrl('http://evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('https://evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('ftp://evil.com', fallback)).toBe(fallback);
            });

            it('should block protocol-relative URLs (//)', () => {
                expect(sanitizeReturnUrl('//evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('//evil.com/path', fallback)).toBe(fallback);
            });

            it('should block javascript: URLs', () => {
                expect(sanitizeReturnUrl('javascript:alert(1)', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('JavaScript:alert(1)', fallback)).toBe(fallback);
            });

            it('should block data: URLs', () => {
                expect(sanitizeReturnUrl('data:text/html,<script>alert(1)</script>', fallback)).toBe(fallback);
            });

            it('should block URLs with special characters', () => {
                expect(sanitizeReturnUrl('/path?redirect=http://evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('/path#http://evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('/path/../../../etc/passwd', fallback)).toBe(fallback);
            });

            it('should block encoded attacks', () => {
                expect(sanitizeReturnUrl('/%2F/evil.com', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('/\\evil.com', fallback)).toBe(fallback);
            });
        });

        describe('edge cases', () => {
            it('should return fallback for null/undefined', () => {
                expect(sanitizeReturnUrl(null, fallback)).toBe(fallback);
                expect(sanitizeReturnUrl(undefined, fallback)).toBe(fallback);
            });

            it('should return fallback for empty string', () => {
                expect(sanitizeReturnUrl('', fallback)).toBe(fallback);
            });

            it('should return fallback for non-string values', () => {
                expect(sanitizeReturnUrl(123, fallback)).toBe(fallback);
                expect(sanitizeReturnUrl({}, fallback)).toBe(fallback);
                expect(sanitizeReturnUrl([], fallback)).toBe(fallback);
            });

            it('should return fallback for paths not starting with /', () => {
                expect(sanitizeReturnUrl('projects/test', fallback)).toBe(fallback);
                expect(sanitizeReturnUrl('relative/path', fallback)).toBe(fallback);
            });
        });
    });

    describe('removeBlockedFiles', () => {
        const testDir = '/tmp/dployr-security-test';

        beforeAll(() => {
            fs.mkdirSync(testDir, { recursive: true });
        });

        afterAll(() => {
            try {
                fs.rmSync(testDir, { recursive: true, force: true });
            } catch {}
        });

        beforeEach(() => {
            // Clean directory
            const files = fs.readdirSync(testDir);
            for (const file of files) {
                fs.unlinkSync(path.join(testDir, file));
            }
        });

        it('should remove Dockerfile', () => {
            const dockerFile = path.join(testDir, 'Dockerfile');
            fs.writeFileSync(dockerFile, 'FROM node:20');

            const removed = removeBlockedFiles(testDir);

            expect(removed).toContain(dockerFile);
            expect(fs.existsSync(dockerFile)).toBe(false);
        });

        it('should remove docker-compose.yml', () => {
            const composeFile = path.join(testDir, 'docker-compose.yml');
            fs.writeFileSync(composeFile, 'version: "3"');

            const removed = removeBlockedFiles(testDir);

            expect(removed).toContain(composeFile);
            expect(fs.existsSync(composeFile)).toBe(false);
        });

        it('should return empty array for empty directory', () => {
            const removed = removeBlockedFiles(testDir);
            expect(removed).toEqual([]);
        });

        it('should return empty array for non-existent path', () => {
            const removed = removeBlockedFiles('/non/existent/path');
            expect(removed).toEqual([]);
        });

        it('should return empty array for null path', () => {
            const removed = removeBlockedFiles(null);
            expect(removed).toEqual([]);
        });

        it('should not remove non-blocked files', () => {
            const safeFile = path.join(testDir, 'index.html');
            fs.writeFileSync(safeFile, '<html></html>');

            const removed = removeBlockedFiles(testDir);

            expect(removed).not.toContain(safeFile);
            expect(fs.existsSync(safeFile)).toBe(true);
        });
    });
});
