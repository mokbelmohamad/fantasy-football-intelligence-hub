# `scripts/validate-project.mjs`

## Purpose

Static project validation command.

## Responsibilities
- Verify required files exist.
- Run JavaScript syntax checks.
- Validate JSON snapshots.
- Confirm index.html loads the ES-module entry point.

## Dependencies
- `Node built-ins`

## Used by
- npm run validate
- npm run check
- GitHub Actions

## Maintenance notes
- Update required-file inventory when architecture changes.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
