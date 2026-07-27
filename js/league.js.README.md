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

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
