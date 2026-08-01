# `js/views/history.js`

## Purpose

Provide the on-demand League History Evidence section inside Settings.

## Responsibilities

- Offer only seasons present in the Analyze-time metadata index.
- Defer deep retrieval until the user opens the League History Evidence section
  in Settings and selects a season.
- Show returned transaction rounds, matchups, playoff brackets, draft details,
  draft selections, and pick trades without inventing absent records.
- Surface partial-load and unavailable-history warnings.
- Hide creator and direct Sleeper user fields before rendering evidence.

## Dependencies

- `api/leagueSession.js`
- `state.js`
- `utils.js`
