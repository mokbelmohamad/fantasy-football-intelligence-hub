
## Version 2.2 state

The shared state now includes `activeView` so the selected report page can remain synchronized with the grouped header selector and browser navigation.
# `js/state.js`

## Purpose

Single shared in-memory state object.

## Responsibilities
- Store the active analysis.
- Store table sort direction.
- Store selected team and filter state.

## Dependencies
- None.

## Used by
- app.js
- render.js
- view modules
- analyze.js

## Maintenance notes
- State is intentionally lightweight and is not a persistence layer.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
