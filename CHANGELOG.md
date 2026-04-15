# Changelog

## 2026-04-16

### Added
- Added MinIO-backed upload support with local storage fallback.
- Added Docker Compose setup for running MinIO with `restart: unless-stopped`.
- Added presigned URL generation for uploaded media and extended the default expiry to 30 days.
- Added a signed media refresh flow so image and video URLs can be renewed before expiry.
- Added `AutoRefreshMedia` and wired it into key image/video display components across the site.

### Changed
- Updated the server upload flow to return signed URLs for MinIO assets.
- Updated environment examples and local server config for MinIO credentials and presign settings.
- Updated several media-rendering pages and components to use the shared auto-refresh logic.

### Notes
- MinIO remains private by default; public access is not required for the site to display media.
- The refresh strategy is intentionally low-traffic: only signed URLs near expiry are renewed.
