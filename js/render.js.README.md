
## Version 2.3 header behavior

`render.js` owns persistent report-page state, URL hash and browser-history synchronization, browser-style tab state, complete league-context rendering (name, ID, settings, linked-season range, and timestamp), focus-team selector population, data-status display, and landing/application header transitions.
# `js/render.js`

## Purpose

Top-level presentation orchestrator.

## Responsibilities
- Switch views and show/hide application shells.
- Coordinate focus-team updates.
- Call each page renderer.
- Build shared team-select options and hydrate deferred Team Insights history.

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

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This documentation reflects the merged feature set and does not change `APP_VERSION`.

The league panel uses a labeled “League: [name]” heading and displays team
count, detected settings, active-year range, season count, and the latest
analysis timestamp. Submitted Sleeper IDs are not rendered.


### Version 2.3 header tabs
All eight report page options, including Settings, are displayed in one
equal-width row along the bottom of the global header. The active page is a
fixed-size blue tab with bold white text that does not overlap report content.

- Header league settings use `deriveStarterCount` and omit starter metadata when it cannot be resolved instead of showing an unavailable placeholder.
