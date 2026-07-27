# JavaScript module structure

- `app.js` — application startup and event listeners
- `analyze.js` — league-analysis orchestration
- `api.js` — network requests, projections, CSV parsing, and Sleeper loading
- `config.js` — version and endpoint configuration
- `league.js` — lineup, league-format, ranking, risk, and pick calculations
- `render.js` — page rendering, tables, charts, exports, and navigation
- `state.js` — shared application state
- `storage.js` — IndexedDB cache helpers
- `tiers.js` — player-tier and team-insight models
- `utils.js` — DOM, formatting, numeric, CSV, and download helpers

The HTML entry point now loads `js/app.js` with `type="module"`.
Run the project through Live Server or another HTTP server; ES modules should not be opened directly through `file://`.
