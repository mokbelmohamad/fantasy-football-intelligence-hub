
## Version 2.3 header behavior

`app.js` binds the browser-style report tabs, immediate Focus Team changes, the
central Change League action, browser-history navigation, and transient-session
cleanup.
# `js/app.js`

## Purpose

Browser entry point. Registers UI event handlers, table sorting, session cleanup,
and global error listeners.

## Responsibilities
- Connect buttons and form controls to application behavior.
- Clear transient league evidence on Change League, page close, or reload.
- Handle unhandled browser errors and promise rejections.

## Dependencies
- `analyze.js`
- `errors.js`
- `state.js`
- `utils.js`
- `tiers.js`
- `render.js`

## Used by
- index.html via <script type="module">

## Maintenance notes
- Keep this file focused on application startup and event wiring.
- Business rules should remain in league.js, tiers.js, or analyze.js.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This documentation reflects the merged feature set and does not change `APP_VERSION`.


### Version 2.3 header tabs
All eight report page options are displayed simultaneously in one equal-width row
along the bottom of the global header. Settings can rerun the Contender Index
from current report percentiles without network access. There is no report
persistence, export, print, or overflow-menu behavior in this entry point.
