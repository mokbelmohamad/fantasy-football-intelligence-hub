# `js/api/sleeper.js`

## Purpose

Sleeper-specific league and player retrieval.

## Responsibilities
- Load NFL state, league bundles, linked history, and matchup weeks.
- Reuse current-season matchup data and fetch linked-season matchup histories.
- Limit matchup retrieval to Weeks 1–17 because the fantasy championship ends
  before NFL Week 18.
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

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This
documentation reflects the merged feature set and does not change
`APP_VERSION`.
