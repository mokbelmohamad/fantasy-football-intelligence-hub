# `js/storage.js`

## Purpose

IndexedDB cache abstraction.

## Responsibilities
- Open the SleeperDynastyAnalyzer database.
- Read and write public player-directory cache entries only.
- Fail safely when browser storage is unavailable.

## Dependencies
- None.

## Used by
- api/sleeper.js

## Maintenance notes
- Current object store name is cache and schema version is 1. It must not store
  league IDs, league bundles, reports, or session evidence.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This documentation reflects the merged feature set and does not change `APP_VERSION`.
