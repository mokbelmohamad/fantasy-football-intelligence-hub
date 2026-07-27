# `js/api/sleeper.js`

## Purpose

Sleeper-specific league and player retrieval.

## Responsibilities
- Load NFL state, league bundles, linked history, and matchup weeks.
- Prefer local player snapshots, then IndexedDB, then live Sleeper data.
- Update source-status details.

## Dependencies
- `config.js`
- `storage.js`
- `utils.js`
- `api/http.js`

## Used by
- analyze.js

## Maintenance notes
- League-specific data remains live because it varies by requested league.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
