# `js/api/index.js`

## Purpose

Public barrel export for provider modules.

## Responsibilities
- Re-export HTTP, Sleeper, RosterAudit, DynastyProcess, and projection functions.

## Dependencies
- `All js/api provider files`

## Used by
- analyze.js
- api.js bridge

## Maintenance notes
- Use named exports to preserve tree-friendly and readable imports.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
