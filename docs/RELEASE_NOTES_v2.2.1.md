# Fantasy Football Intelligence Hub - Version 2.2.1

## Patch summary

Version 2.2.1 includes the active report-tab correction and the merged
Dashboard/Team Insights refinement.

## Changes

- Active and inactive report tabs now use identical height, width, padding, margin, border radius, and position.
- Removed raised-tab movement, negative overlap, visual bridge, and active-state size changes.
- Active tab now uses the product blue background and bold white text.
- Existing report navigation, focus-team persistence, and browser-history behavior are unchanged.
- Updated automated regression tests and release documentation.
- Dashboard is now league-centric, with League Scoring History and League Power
  Rankings rather than focused-team recommendation and roster-review content.
- Team Insights now contains the focused team’s recommendation, key performance
  context, roster/position/bench/draft reviews, Build and Shop candidates,
  optimal-lineup evidence, and full roster.
- League Scoring History plots reported weekly scores across linked seasons,
  emphasizes the focused team, and supports completed-season wins.
- NFL Week 18 is excluded at fetch, analysis, production aggregation, and chart
  rendering layers because it occurs after the fantasy championship.
- The former Optimal Lineups page is now the intentionally blank
  **Coming Soon!** page.
