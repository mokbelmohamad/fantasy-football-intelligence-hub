# `js/api/rosterAudit.js`

## Purpose

RosterAudit value, projection, and pick provider.

## Responsibilities
- Load usable same-origin snapshots when present.
- Fall back to live RosterAudit endpoints.
- Return data plus a source label.

## Dependencies
- `config.js`
- `api/http.js`

## Used by
- analyze.js

## Maintenance notes
- Attribution remains required in the application footer and documentation.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
