# `js/render.js`

## Purpose

Top-level presentation orchestrator.

## Responsibilities
- Switch views and show/hide application shells.
- Coordinate focus-team updates.
- Call each page renderer.
- Build shared team-select options and CSV output.

## Dependencies
- `state.js`
- `utils.js`
- `tiers.js`
- `js/views/*`

## Used by
- app.js
- analyze.js

## Maintenance notes
- Page-specific HTML belongs under js/views/.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
