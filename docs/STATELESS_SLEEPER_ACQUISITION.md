# Phase 1 — Stateless Sleeper Acquisition

## Goal

Make public Sleeper league history available without creating a persistent
league database or saving submitted league identifiers in a report.

## Analyze-time retrieval

Analyze retrieves the current league's metadata, users, rosters, traded picks,
draft list, NFL state, and completed current-season matchups. It then follows
`previous_league_id` links with metadata-only requests to build the linked-season
index. This makes Dashboard available before deep history completes.

## Deferred resources

`js/api/leagueSession.js` owns `LEAGUE_RESOURCE_MANIFEST`:

| Page | Season depth | Deferred resources |
| --- | --- | --- |
| Dashboard | Current | Current completed matchups only |
| Team Insights | All linked seasons | Season roster bundles and Week 1–17 matchups |
| Draft Capital | Selected/current | Existing traded-pick information; detailed draft evidence is available through Settings |
| Settings — League History Evidence | Selected linked season | Transaction rounds 0–18, Week 1–17 matchups, winners/losers brackets, draft lists, draft details, selections, and traded picks |

Each request group is cached in a module-scoped `Map` for the open tab. Changing
leagues, closing the tab, or reloading clears the map. No new league feature
writes to IndexedDB, localStorage, a URL, or a generated report.

## Resilience and correctness

- HTTP requests have a timeout and up to two retries for transient failures.
- Multi-week matchups use concurrency six; transaction rounds use four; draft
  evidence uses two.
- Promise failures are collected and shown as warnings. A missing matchup week
  is omitted rather than represented as zero points.
- Fantasy-team performance requests are capped at Week 17. Week 18 never enters
  production, team history, or chart data.
- Application errors redact long numeric identifiers. League IDs and Sleeper user
  IDs are not placed in analysis payloads, header text, browser history, or app
  error logs.

## Deliberate limits

The public Sleeper API does not guarantee complete historical availability. The
application presents all records it receives, but identifies unavailable or
partial endpoint groups rather than reconstructing missing data.
