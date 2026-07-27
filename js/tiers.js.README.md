# `js/tiers.js`

## Purpose

Player tier scoring and evidence-backed team insight generation.

## Responsibilities
- Calculate longevity scores and same-position percentiles.
- Assign analytical tiers S and 1-4.
- Refresh team/player object references before rendering.
- Generate strengths, weaknesses, strategy, build-around, and shop candidates.

## Dependencies
- `utils.js`
- `league.js`

## Used by
- analyze.js
- render.js
- views/tiers.js
- tests

## Maintenance notes
- Player tier composite remains 60% projection, 25% dynasty value, and 15% longevity.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.0. This documentation update does not change `APP_VERSION` or create a new application release.
