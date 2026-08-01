# `js/api/dynastyProcess.js`

## Purpose

DynastyProcess identity and market-value provider.

## Responsibilities
- Parse CSV payloads.
- Load local normalized snapshots when populated.
- Fall back to current upstream CSV files.

## Dependencies
- `config.js`
- `api/http.js`

## Used by
- analyze.js

## Maintenance notes
- Schema changes upstream should be caught by tests and validation review.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This documentation reflects the merged feature set and does not change `APP_VERSION`.
