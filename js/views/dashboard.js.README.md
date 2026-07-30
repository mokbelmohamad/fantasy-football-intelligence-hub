# `js/views/dashboard.js`

## Purpose

Renders the league-wide dashboard, scoring-history chart, and power rankings.
Focus-team season, historical-performance, and roster-review details live on
Team Insights.

## Version 2.1 responsibilities

- Render League Power Rankings across the full content width.
- Render the league scoring-history chart: every explicitly reported completed
  matchup score through the Week 17 fantasy championship is a weekly point,
  with the focused roster emphasized and all
  other rosters shown for comparison.
- Retain Class, EPPG, Depth, PF, Dynasty Value, Risk, Future 1sts, Contender Index, and Dynasty Rank; add gap to #1, QB/RB/WR/TE/FLEX ranks, biggest strength, and biggest weakness.
- Replace the desktop ranking table with expandable team cards on mobile.
- Direct users to Team Insights for focused-team current-season, historical, and
  championship-recommendation details.

## Dependencies

Uses `state.js`, utilities, league classification/rank helpers, and the shared sortable-table renderer.

## Version baseline

Updated for Fantasy Football Intelligence Hub Version 2.1 / `APP_VERSION` 2.1.0.
