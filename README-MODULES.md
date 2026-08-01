- Version 2.3.0 adds stateless, on-demand Sleeper league-history acquisition;
  replaces report persistence with session-memory caching; and centralizes
  Contender Index settings, Methodology, and League History Evidence in
  Settings.
- Version 2.2.1 changed the active report-tab state to color-only styling and
  derived the header starter count from lineup slots or Sleeper roster positions.
- The shared header has a larger brand area, with release, data-status, and
  version information below the logo. Focus Team and league context sit to its
  right, and eight browser-style report tabs run along the bottom. Sleeper IDs,
  creator text, and overflow controls are intentionally absent.
# Fantasy Football Intelligence Hub architecture

## Added in this package

1. Node calculation tests and fixtures
2. Centralized error handling in `js/errors.js`
3. Provider-specific files under `js/api/`
4. Individual page renderers under `js/views/`
5. Local JSON snapshots under `data/`
6. Scheduled data refresh in `.github/workflows/update-data.yml`

## Commands

```bash
npm test
npm run validate
npm run update:data
npm run check
```

The browser uses local snapshots when they contain usable data and falls back
to live sources when snapshots are empty or unavailable.

`js/render.js` remains the view orchestrator. Each page now has its own module.
`js/analyze.js` loads current data through provider-specific API modules, then
starts the transient linked-season session in `js/api/leagueSession.js`.

`js/api/leagueSession.js` is the Phase 1 resource manifest and session-memory
loader. Analyze indexes linked seasons without loading deep history. Opening
Team Insights lazily retrieves roster and matchup history; opening the
collapsed League History Evidence section in Settings retrieves the selected
season's transaction rounds, matchups, winners and losers brackets, draft
records, selections, and draft-pick trades. Settings can also recalculate the
Contender Index from the loaded report without a network request. Requests are
cached for the tab only and are cleared on `pagehide` or Change League.

- The Dashboard is league-centric: it renders League Scoring History and League
  Power Rankings. Focused-team recommendations, performance, reviews, and
  lineup evidence belong to Team Insights.
- Weekly matchup scoring is capped at the Week 17 fantasy championship. NFL
  Week 18 is excluded from team performance metrics and chart series.
- **Player Trends** is intentionally blank while that feature is in development;
  optimal-lineup evidence remains on Team Insights.

The league panel uses a labeled “League: [name]” heading and displays team
count, detected settings, active-year range, season count, and the latest
analysis timestamp. It deliberately does not display a Sleeper league ID.
