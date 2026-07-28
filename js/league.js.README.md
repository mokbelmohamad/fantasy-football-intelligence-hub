# `js/league.js`

## Purpose

Core league rules and analytical calculations.

## Responsibilities
- Detect format and starting slots.
- Evaluate lineup eligibility.
- Aggregate matchup production.
- Calculate risk, percentiles, classes, pick ownership, and position tiers.
- Solve optimal legal lineups using minimum-cost flow.

## Dependencies
- `utils.js`

## Used by
- analyze.js
- tiers.js
- view modules
- tests

## Maintenance notes
- This is the primary pure-calculation module and should remain highly testable.

## Version baseline

Updated for Fantasy Football Intelligence Hub Version 2.1. Adds linked-season franchise summaries, standings, historical PPG, average finish, and cumulative records.

- `deriveStarterCount(source)` resolves a valid starter count from stored analysis fields, detected setup, or Sleeper roster-position arrays while excluding bench, IR, reserve, and taxi slots.
