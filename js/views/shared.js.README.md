# `js/views/shared.js`

## Purpose

Shared presentation helpers for tables and evidence blocks.

## Responsibilities
- Render sortable table markup.
- Render insight evidence markup.
- Render detailed strength/weakness cards with narratives and supporting metrics
  through `teamInsightReviewHtml()`.

## Dependencies
- `utils.js`

## Used by
- Team Insights uses the shared detailed insight-card renderer; Dashboard,
  lineup, trade, and player views use the relevant table or evidence helpers.

## Maintenance notes
- Keep page-independent markup in this module.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This
documentation update does not change `APP_VERSION` or create a new application
release.
