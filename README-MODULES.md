- Version 2.2.1 changes the active report-tab state to color-only styling so selected tabs no longer grow or overlap report content.
- Version 2.2.1 also derives the header starter count from analysis lineup slots or Sleeper roster positions and removes the `Starter count unavailable` fallback.
- Version 2.2 replaces the separate report-tab banner with a polished two-row global header. Focus Team selection is positioned beside the logo; league name, Sleeper ID, settings, linked-season range, analysis timestamp, and Change League action occupy the center; creator, release, data-status, and version information are stacked at the right; and browser-style report tabs run along the bottom.
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
`js/analyze.js` loads data through provider-specific API modules.

- The Dashboard is league-centric: it renders League Scoring History and League
  Power Rankings. Focused-team recommendations, performance, reviews, and
  lineup evidence belong to Team Insights.
- Weekly matchup scoring is capped at the Week 17 fantasy championship. NFL
  Week 18 is excluded from team performance metrics and chart series.
- The former Optimal Lineups tab is intentionally blank under the
  **Coming Soon!** label; its evidence remains on Team Insights.

The league panel now uses a labeled “League: [name]” heading and displays Sleeper ID, team count, detected settings, active-year range, season count, and the latest analysis timestamp in a single aligned panel.
