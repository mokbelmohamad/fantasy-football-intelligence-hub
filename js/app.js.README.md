# `js/app.js`

## Purpose

Browser entry point. Registers UI event handlers, export actions, table sorting, global error listeners, and embedded-report startup.

## Responsibilities
- Connect buttons and form controls to application behavior.
- Load cached or embedded analysis records.
- Coordinate report exports and printing.
- Handle unhandled browser errors and promise rejections.

## Dependencies
- `analyze.js`
- `errors.js`
- `state.js`
- `storage.js`
- `utils.js`
- `tiers.js`
- `render.js`

## Used by
- index.html via <script type="module">

## Maintenance notes
- Keep this file focused on application startup and event wiring.
- Business rules should remain in league.js, tiers.js, or analyze.js.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
