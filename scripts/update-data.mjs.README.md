# `scripts/update-data.mjs`

## Purpose

Node snapshot refresh job executed locally or by GitHub Actions.

## Responsibilities
- Fetch current source data.
- Normalize CSV into JSON arrays.
- Write same-origin snapshot files.
- Preserve prior files when an optional source update fails.
- Write run metadata and source outcomes.

## Dependencies
- `Node built-ins`
- `Sleeper`
- `RosterAudit`
- `DynastyProcess`

## Used by
- npm run update:data
- GitHub Actions

## Maintenance notes
- No secrets are required for current public sources.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
