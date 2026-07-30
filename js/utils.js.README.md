# `js/utils.js`

## Purpose

Shared DOM, numeric, formatting, CSV, download, and status helpers.

## Responsibilities
- Select DOM elements.
- Escape HTML.
- Normalize numbers and nulls.
- Format display values.
- Create downloads and CSV-safe values.
- Update progress and source badges.

## Dependencies
- None.

## Used by
- Most runtime modules

## Maintenance notes
- Keep helpers side-effect free except explicitly UI-oriented functions such as log and setSources.

## Version baseline

Documented for Fantasy Football Intelligence Hub Version 2.2.1. This documentation reflects the merged feature set and does not change `APP_VERSION`.
