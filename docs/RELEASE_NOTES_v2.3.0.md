# Fantasy Football Intelligence Hub — Version 2.3.0

**Release date:** August 1, 2026

## Highlights

- Added Phase 1 stateless Sleeper acquisition. Analyze now makes the Dashboard
  usable from current data while it builds a metadata-only linked-season index.
- Added on-demand, session-only retrieval for historical roster bundles,
  matchups, transaction rounds, draft details, draft selections, traded picks,
  and winners/losers playoff brackets.
- Added Settings as the central configuration and documentation area. It hosts
  Contender Index weights, Methodology, and collapsed League History Evidence.
- Moved detailed focused-team context to Team Insights and preserved the
  Dashboard as a league-wide comparison view.

## Data handling and resilience

- New evidence requests use bounded concurrency, timeouts, retries, progress
  messaging, and visible partial-failure warnings.
- Deep history is cached only in memory for the current browser tab. It is
  cleared when the user reloads, closes the tab, or changes leagues.
- League IDs and Sleeper user identifiers are excluded from the analysis
  payload, browser URL, header, telemetry, and application error messages.
- Week 18 is excluded from fantasy-team performance calculations and charts.
- Missing upstream data stays visibly missing; the application does not invent
  zero values for absent records.

## Product experience

- Removed report persistence, report export/print controls, report loading and
  deletion controls, advanced detection overrides, and header overflow menus.
- Simplified the landing page to the league ID and Contender Index weights.
- Updated the header with a larger brand area and compact release/data/version
  details below the logo.
- Methodology is now part of Settings rather than a standalone tab.
- Corrected EPPG Gap to #1 so teams that project above the ranking leader show
  a positive gap instead of a double-negative.
- Reordered report navigation: Dashboard, Team Insights, Trade Center, Draft
  Capital, Player Trends, Player Tiers, Player Master, and Settings.
- Renamed Trade Finder to **Trade Center** and the blank Coming Soon! page to
  **Player Trends**.

## Validation

- `npm test` — 41 tests passing.
- `npm run validate` — passed.
- `npm run check` — passed.
- `git diff --check` — passed.

## Known limitations

- Sleeper does not guarantee complete historical endpoint coverage. The app
  presents records received from Sleeper and identifies partial or unavailable
  endpoint groups instead of reconstructing missing history.
- Player Trends remains an intentionally blank placeholder for a future
  feature.
