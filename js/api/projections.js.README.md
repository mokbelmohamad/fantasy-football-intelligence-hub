# `js/api/projections.js`

## Purpose

Sleeper projection response normalization and fallback loading.

## Responsibilities
- Flatten supported response shapes.
- Extract player IDs and flexible fields.
- Prefer a current-season local projection snapshot.
- Fall back to full or position-specific live projection calls.

## Dependencies
- `config.js`
- `api/http.js`

## Used by
- analyze.js

## Maintenance notes
- Snapshot season must match the requested analysis season.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
