# `js/api/sleeper.js`

## Purpose

Sleeper-specific league and player retrieval.

## Responsibilities
- Load NFL state, current league bundles, linked-season metadata, matchup weeks,
  transaction rounds, draft records, draft detail/pick/traded-pick evidence,
  and playoff brackets.
- Return partial-data diagnostics for transaction, draft, and bracket requests.
- Limit matchup retrieval to Weeks 1–17 because the fantasy championship ends
  before NFL Week 18.
- Prefer local player snapshots, then the daily player-directory IndexedDB
  cache, then live Sleeper data. League data is never written to IndexedDB.
- Use timeout and retry transport helpers; callers use bounded concurrency for
  multi-week, multi-round, and multi-draft collection.
- Update source-status details.

## Dependencies
- `config.js`
- `storage.js`
- `utils.js`
- `api/http.js`

## Used by
- analyze.js

## Maintenance notes
- League-specific data remains live and session-only because it varies by the
  requested league.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This
documentation reflects the merged feature set and does not change
`APP_VERSION`.
