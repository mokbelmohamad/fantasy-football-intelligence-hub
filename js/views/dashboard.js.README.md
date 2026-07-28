# `js/views/dashboard.js`

## Purpose

Renders the league dashboard and focus-team analytical summaries.

## Version 2.1 responsibilities

- Render separate Current Season and Overall Performance summary sections.
- Display Contender Rank, Expected PPG, gaps to the leader and league average, actual current standing/record, historical average PPG and rank, average finish, cumulative record, and win percentage.
- Render League Power Rankings across the full content width.
- Retain Class, EPPG, Depth, PF, Dynasty Value, Risk, Future 1sts, Contender Index, and Dynasty Rank; add gap to #1, QB/RB/WR/TE/FLEX ranks, biggest strength, and biggest weakness.
- Replace the desktop ranking table with expandable team cards on mobile.
- Render Championship Outlook with an expanded plain-language explanation, supporting metrics, and explicit hold/no-move outcomes.
- Render dedicated Team Strengths and Areas to Improve reviews beneath the championship outlook.
- Render narrative-first position reviews with structured data for QB, RB, WR, TE, FLEX, Bench Depth, and Draft Capital.

## Dependencies

Uses `state.js`, utilities, league classification/rank helpers, and the shared sortable-table renderer.

## Version baseline

Updated for Fantasy Football Intelligence Hub Version 2.1 / `APP_VERSION` 2.1.0.
