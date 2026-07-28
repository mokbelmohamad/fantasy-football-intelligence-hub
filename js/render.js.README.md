
## Version 2.2 header behavior

`render.js` owns persistent report-page state, URL hash and browser-history synchronization, browser-style tab state, complete league-context rendering (name, ID, settings, linked-season range, and timestamp), focus-team selector population, data-status display, and landing/application header transitions.
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

The league panel now uses a labeled “League: [name]” heading and displays Sleeper ID, team count, detected settings, active-year range, season count, and the latest analysis timestamp in a single aligned panel.


### Version 2.2 header tabs
All eight report page options are displayed simultaneously in one equal-width row along the bottom of the global header. The active page is rendered as a fixed-size blue tab with bold white text that does not overlap the report content.

- Header league settings use `deriveStarterCount` and omit starter metadata when it cannot be resolved instead of showing an unavailable placeholder.
