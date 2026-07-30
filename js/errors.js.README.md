# `js/errors.js`

## Purpose

Central error normalization, reporting, and user-facing message generation.

## Responsibilities
- Represent structured application errors.
- Classify timeout and network failures.
- Preserve source and recovery details.
- Log normalized errors consistently.

## Dependencies
- None.

## Used by
- app.js
- analyze.js

## Maintenance notes
- Avoid exposing technical stack details in normal user messages.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
