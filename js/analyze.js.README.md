# `js/analyze.js`

## Purpose

End-to-end league analysis orchestrator.

## Responsibilities
- Validate the league ID and user options.
- Load Sleeper, RosterAudit, DynastyProcess, and snapshot data.
- Normalize players and construct roster/free-agent analytical records.
- Build legal lineups, team metrics, ranks, insights, and the final analysis object.
- Fetch linked-season matchup history and attach chart-ready weekly history to
  every team.
- Cap matchup-derived performance data at the Week 17 fantasy championship.
- Cache completed analysis and trigger rendering.

## Dependencies
- `config.js`
- `state.js`
- `storage.js`
- `utils.js`
- `api/index.js`
- `league.js`
- `tiers.js`
- `render.js`
- `errors.js`

## Used by
- app.js

## Maintenance notes
- Provider-specific retrieval belongs under js/api/.
- This module owns orchestration, not low-level transport or individual view markup.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. It attaches
linked-season summaries and Week 1–17 weekly histories to each team record.
