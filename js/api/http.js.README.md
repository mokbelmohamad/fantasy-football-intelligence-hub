# `js/api/http.js`

## Purpose

Low-level HTTP and same-origin snapshot utilities.

## Responsibilities
- Fetch with timeout and no-store behavior.
- Retry transient JSON requests with a short, bounded network backoff.
- Load JSON and text.
- Run bounded-concurrency workers.
- Load and validate local JSON snapshots.

## Dependencies
- None.

## Used by
- All provider modules

## Maintenance notes
- Provider modules should use this transport rather than call fetch directly.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This documentation reflects the merged feature set and does not change `APP_VERSION`.
