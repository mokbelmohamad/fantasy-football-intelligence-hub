# `js/api/leagueSession.js`

## Purpose

Own the stateless, browser-memory session for a selected Sleeper league.

## Responsibilities

- Define `LEAGUE_RESOURCE_MANIFEST`, which records the endpoint groups and
  season depth used by Dashboard, Team Insights, Draft Capital, and League
  History.
- Retain submitted league IDs only while the tab is open so it can retrieve
  deferred evidence from Sleeper.
- Cache each in-flight or completed session request by resource key, preventing
  duplicate Sleeper calls while the page remains open.
- Load all linked team roster/matchup history for Team Insights only when it is
  requested.
- Load selected-season transactions, matchups, brackets, drafts, draft details,
  selections, and traded picks for League History only when requested.
- Clear all league-session data on Change League, page close, or reload.

## Dependencies

- `api/sleeper.js`

## Maintenance notes

- This is intentionally not a persistence layer. Do not write its contents to
  IndexedDB, localStorage, URLs, logs, telemetry, or generated artifacts.
- Preserve the Week 17 matchup cutoff in downstream Sleeper loaders.
