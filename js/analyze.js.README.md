# `js/analyze.js`

## Purpose

End-to-end league analysis orchestrator.

## Responsibilities
- Validate the league ID and Contender Index weights.
- Load Sleeper, RosterAudit, DynastyProcess, and snapshot data.
- Normalize players and construct roster/free-agent analytical records.
- Build legal lineups, team metrics, ranks, insights, and the final analysis object.
- Build a metadata-only linked-season index, then begin a transient session for
  deferred history retrieval.
- Cap matchup-derived performance data at the Week 17 fantasy championship.
- Keep the completed analysis in memory and trigger rendering; it does not save
  a league report to IndexedDB.

## Dependencies
- `config.js`
- `state.js`
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

Documented for the Phase 1 stateless acquisition work on the Version 2.3.0
baseline. Initial rendering uses current-season evidence; Team Insights and the
collapsed League History Evidence area in Settings hydrate deeper linked-season
evidence only when opened. `applyContenderWeights` recalculates rankings from
existing percentiles and makes no network request.
