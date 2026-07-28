# `js/tiers.js`

## Purpose

Player tier scoring and explainable team insight generation.

## Responsibilities

- Calculate longevity scores and same-position percentiles.
- Assign analytical tiers S and 1-4.
- Refresh team/player object references before rendering.
- Generate legacy strength and weakness evidence for compatibility.
- Generate Championship Outlook recommendations with expanded rationale, confidence, and supporting metrics.
- Support explicit hold/no-move recommendations when a roster is already strong and balanced.
- Generate narrative-first reviews for QB, RB, WR, TE, FLEX, Bench Depth, and Draft Capital.
- Derive position status and recommended action from league rank, projected output, depth, age, risk, and capital.

## Dependencies

- `utils.js`
- `league.js`

## Used by

- `analyze.js`
- `render.js`
- `views/dashboard.js`
- `views/tiers.js`
- tests

## Maintenance notes

- Player tier composite remains 60% projection, 25% dynasty value, and 15% longevity.
- Championship recommendations are deterministic strategic guidance, not transaction-level trade valuations or specific trade offers.

## Version baseline

Updated for Fantasy Football Intelligence Hub Version 2.1 / `APP_VERSION` 2.1.0.
