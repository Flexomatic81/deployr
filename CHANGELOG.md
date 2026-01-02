# Changelog

All notable changes to Dployr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - 2026-01-02

### Added
- **Backup & Restore Feature**: Complete backup system for projects and databases
  - Project backups as tar.gz archives (excludes node_modules, vendor, .git)
  - Database backups for MariaDB and PostgreSQL
  - Restore functionality for both project and database backups
  - Backup preview showing archive contents
  - Backup history and statistics
- Database backup button in project detail page (linked to project's configured database)
- `/dployr-release` skill for creating releases with changelog

### Fixed
- Open Redirect vulnerability in backup routes (security fix)
- N+1 query performance issue in admin dashboard
- Delete modals moved outside table for valid HTML structure
- Database clients (mariadb-client, postgresql-client) installed in dashboard container

### Changed
- Improved update notification UX in dashboard

### Security
- Added `sanitizeReturnUrl()` function to prevent open redirect attacks
- Optimized `getTotalProjectCount()` to avoid N+1 database queries

## [v1.0.0] - 2024-12-XX

### Added
- Initial release of Dployr
- Multi-user hosting platform with Docker isolation
- Project types: Static, PHP, Node.js, Laravel, Next.js, Nuxt.js, Python Flask/Django
- Database provisioning: MariaDB and PostgreSQL
- Git deployment with auto-deploy and webhooks
- ZIP upload deployment
- Nginx Proxy Manager integration for domains and SSL
- Email notifications for deployments
- Admin dashboard with user management
- System updates from GitHub releases

[v1.1.0]: https://github.com/Flexomatic81/dployr/releases/tag/v1.1.0
[v1.0.0]: https://github.com/Flexomatic81/dployr/releases/tag/v1.0.0
