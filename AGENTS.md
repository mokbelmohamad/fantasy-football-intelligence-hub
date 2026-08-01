# Fantasy Football Intelligence Hub — Agent Working Agreement

## Purpose

This file defines the delivery, validation, documentation, and release workflow
for changes to Fantasy Football Intelligence Hub.

## Repository scope

Primary repository:

`/Users/mohamadmokbel/Documents/GitHub/fantasy-football-intelligence-hub`

Keep changes within the approved feature scope. Preserve unrelated work already
present in the working tree, including Finder metadata files such as `.DS_Store`.

Do not make external GitHub changes, publish releases, or delete files unless
explicitly authorized.

## Change-control workflow

Before implementation:

1. Review the relevant roadmap item and change request.
2. Confirm the intended scope, acceptance criteria, affected pages, data fields,
   calculations, and documentation impact.
3. Record or update the change request when the work is material.
4. Update the roadmap status when work starts, is deferred, or ships.

During implementation:

1. Reuse existing shared components and calculations where practical.
2. Keep page-specific behavior inside the relevant view module.
3. Preserve calculations unless a requirement explicitly changes them.
4. Add or update regression coverage for changed behavior.
5. Add plain-language comments when logic would be unclear to a non-software
   engineer.

## Required validation

For every release, run:

```bash
npm test
npm run validate
npm run check
git diff --check
```

### Required layout validation

Every release must include a visual layout review of every report page, even
when a page was not directly changed.

Review at least:

- Dashboard
- Team Insights
- Player Trends
- Trade Center
- Player Master
- Player Tiers
- Draft Capital
- Settings (including Methodology and League History Evidence)

Verify the shared header, Focus Team selector, page navigation, panels, tables,
charts, empty states, and footer behavior. Check for clipping, overlap,
unexpected horizontal scrolling, misaligned table headers, broken chart labels,
and layout shifts.

Review the standard desktop layout and a narrow responsive viewport. A layout
review does not authorize a mobile redesign; it only confirms that the existing
responsive experience remains usable.

## Documentation requirements

The repository is the engineering source of truth. Update applicable files in:

- `README.md`
- `README-MODULES.md`
- `docs/`
- relevant `*.README.md` companion files
- release notes
- test documentation

Maintain the documentation library as releases are prepared:

- `01_Software_Design_Specification` — product behavior, data flow, testing,
  deployment, or architecture changes
- `02_Data_Dictionary` — changed analysis, player, team, provider, cache, or
  metric fields
- `03_Architecture` — changed modules, integrations, storage, or data flow
- `04_Product_Roadmap` — roadmap status and release targets
- `05_Release_Notes` — user-facing release summary, validation, and limitations
- `06_Change_Requests` — proposal, scope, approval, completion, or deferral

Do not overwrite historical release artifacts. Use versioned, dated documents so
each release remains auditable.

## Release handoff

Before requesting a commit or release, provide:

- files changed
- tests and validation results
- visual layout review results for every page
- manual test steps
- documentation updated
- known limitations
- recommended commit message
- recommended GitHub release/PR description

After merge, update the roadmap item to shipped and record the release in the
documentation library.
