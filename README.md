# fantasy-football-intelligence-hub
Fantasy football league analytics, dynasty rankings, player tiers, and weekly trend reporting.

## Version 2.1 design documentation

- [Software Design Specification (PDF)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.pdf)
- [Software Design Specification source (DOCX)](docs/Fantasy_Football_Intelligence_Hub_Software_Design_Specification.docx)
- [Architecture diagram](docs/architecture/Fantasy_Football_Intelligence_Hub_Architecture_v2.png)
- [JavaScript file documentation index](docs/JAVASCRIPT_FILE_DOCUMENTATION_INDEX.md)

This documentation refresh records the completed Version 2.1 architecture and does not increment the application version.


## Version 2.1 release

Version 2.1 simplifies league analysis with automatic setup detection and a paced loading workflow. The dashboard now separates Current Season metrics from Overall Performance metrics, including historical average PPG, historical PPG rank, average finish, cumulative record, and win percentage across matched linked seasons.

### Dashboard ranking and recommendation updates

- League Power Rankings now use the full dashboard width.
- The standalone Projected Lineup PPG chart has been removed; EPPG remains in the ranking table.
- Power rankings retain the original Class, EPPG, Depth, PF, Dynasty Value, Risk, Future 1sts, Contender Index, and Dynasty Rank fields, while adding Gap to #1, QB, RB, WR, TE, and FLEX ranks plus each team's biggest strength and weakness.
- The bottom section is now Championship Outlook & Roster Review, with a detailed narrative recommendation and dedicated Team Strengths and Areas to Improve reviews. Each review now uses analytical plain text followed by structured supporting metrics; the separate Position Group Reviews block has been removed.
