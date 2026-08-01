# `js/views/teams.js`

## Purpose

Team Insights page renderer.

## Responsibilities

- Render one focused-team desktop report controlled by the shared header selector.
- Present, in order: championship recommendation, Current Season, Overall
  Performance, roster profile, league history, strengths/weaknesses,
  position/bench/draft reviews, Build/Shop candidates, and optimal-lineup
  evidence, followed by the full roster.
- Safely show no-report, no-team, no-history, and no-lineup states.

## Data requirements

`js/analyze.js` adds `weeklyHistory` to every team using
`buildHistoricalTeamWeeklyPpg()` in `js/league.js`. The Dashboard uses it for
league scoring history; it matches previous seasons by owner before falling
back to roster ID, so a Sleeper roster-number change does not break the visual
history. Week 18 is excluded because it follows the fantasy championship.

Risk is calculated in `riskFor()` in `js/league.js`. It exposes both legacy
`score`/`tier` fields and normalized `riskScore`/`riskTier` fields so table and
candidate views show the same risk classification.

`buildTeamInsights()` supplies Build candidates (young, playable, valuable
rostered players) and Shop candidates (older, still-marketable contributors).
The two lists never overlap.

## Dependencies
- `state.js`
- `utils.js`
- `league.js`
- `views/shared.js`

## Used by
- render.js

## Maintenance notes
- Uses analysis insights prepared by `tiers.js` and the shared detailed insight
  cards from `views/shared.js`, keeping Team Insights evidence consistent.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.3.0. This
documentation update does not change `APP_VERSION` or create a new application
release.
