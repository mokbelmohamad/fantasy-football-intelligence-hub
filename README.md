 The league panel now uses a labeled “League: [name]” heading and displays Sleeper ID, team count, detected settings, active-year range, season count, and the latest analysis timestamp in a single aligned panel.
## Version 2.2 release

Version 2.2 consolidates application navigation and league context into one polished two-row header. The Focus Team selector sits beside the logo, complete league information is centered with a dedicated Change League action, and creator, release, data-status, and version information are stacked at the far right. Report pages are presented as browser-style tabs along the bottom edge of the header. Page selection is preserved across refreshes and participates in browser Back and Forward navigation.
# fantasy-football-intelligence-hub
Fantasy football league analytics, dynasty rankings, player tiers, and weekly trend reporting.

## Version 2.2 design documentation

- [Software Design Specification (PDF)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.pdf)
- [Software Design Specification source (DOCX)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.docx)
- [Architecture diagram](docs/architecture/Fantasy_Football_Intelligence_Hub_Architecture_v2.png)
- [JavaScript file documentation index](docs/JAVASCRIPT_FILE_DOCUMENTATION_INDEX.md)

This documentation set records the completed Version 2.2 application shell, navigation, dashboard, and analytical behavior.


## Version 2.1 release

Version 2.1 simplifies league analysis with automatic setup detection and a paced loading workflow. The dashboard now separates Current Season metrics from Overall Performance metrics, including historical average PPG, historical PPG rank, average finish, cumulative record, and win percentage across matched linked seasons.

### Dashboard ranking and recommendation updates

- League Power Rankings now use the full dashboard width.
- The standalone Projected Lineup PPG chart has been removed; EPPG remains in the ranking table.
- Power rankings retain the original Class, EPPG, Depth, PF, Dynasty Value, Risk, Future 1sts, Contender Index, and Dynasty Rank fields, while adding Gap to #1, QB, RB, WR, TE, and FLEX ranks plus each team's biggest strength and weakness.
- The bottom section is now Championship Outlook & Roster Review, with a detailed narrative recommendation and dedicated Team Strengths and Areas to Improve reviews. Each review now uses analytical plain text followed by structured supporting metrics; the separate Position Group Reviews block has been removed.


### Version 2.2 header tabs
All eight report page options are displayed simultaneously in one equal-width row along the bottom of the global header. The active page is rendered as a taller, raised browser-style tab whose background extends into the report content area.
