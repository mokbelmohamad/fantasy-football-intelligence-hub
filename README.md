# fantasy-football-intelligence-hub

Static, browser-based fantasy football league analytics for public Sleeper
leagues. It combines current data, on-demand linked-season evidence,
projections, dynasty market values, roster composition, risk, and draft capital
into league-wide and focused-team reports.

## Stateless Sleeper acquisition

Analyzing a league loads only the live data needed to make the Dashboard usable:
league metadata, users, rosters, current traded picks and draft list, NFL state,
and completed current-season matchups. It also builds a metadata-only index of
linked seasons. Transactions, historical matchups, playoff brackets, draft
details, selections, and traded picks load only when the relevant history view
is opened. They are cached only in browser memory for the open tab and are
cleared when the tab closes, reloads, or the user changes leagues.

Sleeper calls use timeouts, bounded concurrency, retry attempts, and visible
partial-data warnings. Missing upstream records are never converted to zeros.
League IDs and Sleeper user identifiers are excluded from the analysis object,
browser URL, and application error messages. IndexedDB remains limited to the
daily public player directory cache; league reports are not saved locally.

## Current product experience

- **Dashboard** is league-centric: it provides the League Scoring History chart
  and League Power Rankings.
- **Team Insights** is focused-team-centric: it presents a championship
  recommendation, current-season and overall-performance context, roster and
  position reviews, Build/Shop candidates, optimal-lineup evidence, and the
  complete roster.
- **Settings** contains methodology, lets you reweight the Contender Index and rerun rankings from
  the in-memory analysis without another Sleeper request. Its collapsed League
  History Evidence section loads every returned transaction, draft, matchup,
  and bracket record for a selected season only when opened.
- **League Scoring History** on Dashboard plots every reported matchup score through the
  Week 17 fantasy championship. The focused team is bold; other league teams
  are faint comparison lines. NFL Week 18 is excluded from all team-performance
  data.
- **Player Trends** intentionally remains blank while the next feature is being
  developed. Optimal-lineup evidence is available on Team Insights.

The shared header retains the selected focus team and report page across browser
history navigation. Its larger logo contains the release, data-status, and
version details; it intentionally has no overflow menu or creator label.

## Documentation

- [Software Design Specification (PDF)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.pdf)
- [Software Design Specification source (DOCX)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.docx)
- [Release notes](docs/RELEASE_NOTES_v2.3.0.md)
- [Stateless Sleeper acquisition](docs/STATELESS_SLEEPER_ACQUISITION.md)
- [Architecture diagram](docs/architecture/Fantasy_Football_Intelligence_Hub_Architecture_v2.png)
- [JavaScript file documentation index](docs/JAVASCRIPT_FILE_DOCUMENTATION_INDEX.md)

## Validation

Run `npm test`, `npm run validate`, or `npm run check`. The final command
runs the test suite and project validation together.
