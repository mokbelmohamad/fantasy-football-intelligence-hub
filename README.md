# fantasy-football-intelligence-hub

Static, browser-based fantasy football league analytics for public Sleeper
leagues. It combines league history, projections, dynasty market values, roster
composition, risk, and draft capital into league-wide and focused-team reports.

## Current product experience

- **Dashboard** is league-centric: it provides the League Scoring History chart
  and League Power Rankings.
- **Team Insights** is focused-team-centric: it presents a championship
  recommendation, current-season and overall-performance context, roster and
  position reviews, Build/Shop candidates, optimal-lineup evidence, and the
  complete roster.
- **League Scoring History** plots every reported matchup score through the
  Week 17 fantasy championship. The focused team is bold; other league teams
  are faint comparison lines. NFL Week 18 is excluded from all team-performance
  data.
- **Coming Soon!** intentionally remains blank while the next feature is being
  developed. Optimal-lineup evidence is available on Team Insights.

The shared header retains the selected focus team and report page across browser
history navigation and refreshes.

## Documentation

- [Software Design Specification (PDF)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.pdf)
- [Software Design Specification source (DOCX)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.docx)
- [Release notes](docs/RELEASE_NOTES_v2.2.1.md)
- [Architecture diagram](docs/architecture/Fantasy_Football_Intelligence_Hub_Architecture_v2.png)
- [JavaScript file documentation index](docs/JAVASCRIPT_FILE_DOCUMENTATION_INDEX.md)

## Validation

Run `npm test`, `npm run validate`, or `npm run check`. The final command
runs the test suite and project validation together.
