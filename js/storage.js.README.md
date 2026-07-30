# `js/storage.js`

## Purpose

IndexedDB cache abstraction.

## Responsibilities
- Open the SleeperDynastyAnalyzer database.
- Read, write, and delete cache entries.
- Fail safely when browser storage is unavailable.

## Dependencies
- None.

## Used by
- app.js
- analyze.js
- api/sleeper.js

## Maintenance notes
- Current object store name is cache and schema version is 1.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
