import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("global header replaces standalone report tabs", async () => {
  const html = await read("index.html");
  assert.match(html, /id="headerPageTabs"/);
  assert.match(html, /class="header-page-tab active"/);
  assert.match(html, /id="headerLeagueContext"/);
  assert.match(html, /id="activeLeagueId"/);
  assert.match(html, /id="activeLeagueHistory"/);
  assert.match(html, /Mohamad Mokbel/);
  assert.match(html, /Released July 28, 2026/);
  assert.match(html, /id="globalTeamSelect"/);
  assert.match(html, /id="headerMoreMenu"/);
  assert.doesNotMatch(html, /id="tabs"/);
  assert.doesNotMatch(html, /id="topBanner"/);
});

test("version 2.2.1 is consistent in runtime configuration", async () => {
  const config = await read("js/config.js");
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(config, /APP_VERSION = "2\.2\.1"/);
  assert.equal(packageJson.version, "2.2.1");
});


test("header context rendering tolerates optional mobile-only nodes", async () => {
  const render = await read("js/render.js");
  assert.match(render, /if \(mobileLeagueName\)/);
  assert.match(render, /if \(mobileLeagueSettings\)/);
  assert.match(render, /if \(mobileLeagueUpdated\)/);
  assert.match(render, /if \(mobileDataStatus\)/);
});

test("focus team, league information and more controls share aligned sizing", async () => {
  const layout = await read("css/layout.css");
  assert.match(layout, /\.header-focus-field,\s*\.header-league-context,\s*\.header-more-menu > summary/);
  assert.match(layout, /min-height:\s*108px/);
  assert.match(layout, /\.header-page-tabs:not\(\.hidden\)/);
});


test("league header renders labeled name and complete metadata", async () => {
  const html = await read("index.html");
  const render = await read("js/render.js");
  assert.match(html, /League: Loading/);
  assert.match(render, /`League: \${leagueName}`/);
  assert.match(render, /Sleeper ID:/);
  assert.match(render, /teams`/);
  assert.match(render, /Active \${historyStart}–\${historyEnd}/);
  assert.match(render, /Analysis updated/);
});


test("report tabs are forced visible for active reports", async () => {
  const layout = await readFile(new URL("../../css/layout.css", import.meta.url), "utf8");
  assert.match(layout, /body\.app-active #headerPageTabs/);
  assert.match(layout, /display:\s*grid\s*!important/);
});


test("all report page options use one equal-width browser-style row", async () => {
  const html = await read("index.html");
  const layout = await read("css/layout.css");
  const tabs = [...html.matchAll(/class="header-page-tab(?: active)?"/g)];
  assert.equal(tabs.length, 8);
  assert.match(layout, /grid-template-columns:repeat\(8,minmax\(0,1fr\)\)/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*min-height:38px/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*margin-top:5px/);
  assert.doesNotMatch(layout, /\.header-page-tab\.active::after/);
});


test("page tabs bind click navigation even when optional mobile controls are absent", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /querySelectorAll\("\.header-page-tab"\)/);
  assert.match(app, /addEventListener\("click"/);
  assert.match(app, /switchTab\(event\.currentTarget\.dataset\.view\)/);
  assert.match(app, /bind\("#mobileTeamSelect"/);
});

test("active report tab changes color without changing layout", async () => {
  const layout = await readFile(new URL("../../css/layout.css", import.meta.url), "utf8");
  assert.match(layout, /\.header-page-tab\.active[\s\S]*background:var\(--blue\)/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*color:#fff/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*font-weight:900/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*transform:none/);
  assert.match(layout, /\.header-page-tab\.active[\s\S]*box-shadow:none/);
  assert.doesNotMatch(layout, /\.header-page-tab\.active::after/);
});

test("league settings summary derives starter count and omits unavailable fallback", async () => {
  const render = await read("js/render.js");
  const league = await read("js/league.js");
  assert.match(render, /deriveStarterCount\(analysis\)/);
  assert.match(render, /starters \? `Start \$\{starters\}` : null/);
  assert.match(render, /cleanFormatLabel\(analysis\.formatLabel\)/);
  assert.match(render, /starter\\s\*count/);
  assert.doesNotMatch(render, /"Starter count unavailable"/);
  assert.match(league, /export function deriveStarterCount/);
  assert.match(league, /\"BN\",\"BENCH\",\"IR\",\"RESERVE\",\"TAXI\"/);
});

test("header summary prefers canonical formatKey and appends derived starter count", async () => {
  const { leagueSettingsSummary } = await import("../render.js?header-summary-test");
  const summary = leagueSettingsSummary({
    totalRosters: 12,
    formatKey: "1qb_ppr",
    formatLabel: "1QB PPR · Starter count unavailable",
    starterCount: 10,
  });
  assert.equal(summary, "12 teams · 1QB PPR · Start 10");
});

test("Dashboard is league-centric while Team Insights owns focused-team summaries", async () => {
  const dashboard = await read("js/views/dashboard.js");
  const teams = await read("js/views/teams.js");
  assert.doesNotMatch(dashboard, /Championship Outlook & Roster Review/);
  assert.doesNotMatch(dashboard, /<h2 id="currentSeasonTitle">Current Season/);
  assert.match(dashboard, /League Scoring History/);
  assert.match(teams, /teamCurrentSeasonTitle/);
  assert.match(teams, /teamOverallPerformanceTitle/);
});

test("the former Optimal Lineups tab is reserved for the Coming Soon feature", async () => {
  const html = await read("index.html");
  const lineups = await read("js/views/lineups.js");
  assert.match(html, /data-view="lineups">Coming Soon!/);
  assert.match(lineups, /innerHTML=""/);
  assert.doesNotMatch(lineups, /All League Lineups/);
});
