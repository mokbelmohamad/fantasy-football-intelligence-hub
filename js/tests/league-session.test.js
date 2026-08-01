import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LEAGUE_RESOURCE_MANIFEST } from "../api/leagueSession.js";
import { leagueHistorySeries } from "../views/dashboard.js";

test("resource manifest defers deep Sleeper evidence to the relevant report pages", () => {
  assert.deepEqual(LEAGUE_RESOURCE_MANIFEST.dashboard, {
    depth: "current",
    resources: ["currentMatchups"],
  });
  assert.equal(LEAGUE_RESOURCE_MANIFEST.teams.depth, "all");
  assert.ok(LEAGUE_RESOURCE_MANIFEST.history.resources.includes("transactions"));
  assert.ok(LEAGUE_RESOURCE_MANIFEST.history.resources.includes("winnersBracket"));
  assert.ok(LEAGUE_RESOURCE_MANIFEST.history.resources.includes("draftPicks"));
});

test("Sleeper acquisition has retries, bounded concurrency, and a Week 17 ceiling", async () => {
  const sleeper = await readFile(new URL("../api/sleeper.js", import.meta.url), "utf8");
  const http = await readFile(new URL("../api/http.js", import.meta.url), "utf8");
  assert.match(http, /export async function fetchJsonWithRetry/);
  assert.match(sleeper, /const LAST_LEAGUE_WEEK = 17/);
  assert.match(sleeper, /Math\.min\(Math\.max\(Number\(maxWeek\) \|\| 0, 0\), LAST_LEAGUE_WEEK\)/);
  assert.match(sleeper, /\n\s*4,\n\s*\);/);
  assert.match(sleeper, /\}, 2\);/);
});

test("analysis does not persist submitted league data and clears session state on tab close", async () => {
  const analyze = await readFile(new URL("../analyze.js", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.doesNotMatch(analyze, /idbSet\(/);
  assert.match(analyze, /beginLeagueSession\(/);
  assert.match(app, /window\.addEventListener\("pagehide", clearLeagueSession\)/);
});

test("settings can recalculate rankings from existing report percentiles without a Sleeper call", async () => {
  const analyze = await readFile(new URL("../analyze.js", import.meta.url), "utf8");
  assert.match(analyze, /export function applyContenderWeights/);
  assert.match(analyze, /team\.contenderScore = 100/);
  assert.match(analyze, /team\.insights = buildTeamInsights/);
});

test("league history keeps every completed Week 1-17 score including real zeros", () => {
  const history = leagueHistorySeries({
    teams: [{ rosterId: 1, team: "Team", weeklyHistory: [{ season: 2026, weekly: [{ week: 17, points: 0 }, { week: 18, points: 99 }] }] }],
  });
  assert.deepEqual(history.series[0].points, [{ season: 2026, week: 17, value: 0 }]);
});
