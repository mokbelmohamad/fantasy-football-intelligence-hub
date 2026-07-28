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

test("version 2.2 is consistent in runtime configuration", async () => {
  const config = await read("js/config.js");
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(config, /APP_VERSION = "2\.2\.0"/);
  assert.equal(packageJson.version, "2.2.0");
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
  assert.match(layout, /\.header-page-tab\.active[\s\S]*min-height:43px/);
  assert.match(layout, /\.header-page-tab\.active::after/);
});


test("page tabs bind click navigation even when optional mobile controls are absent", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /querySelectorAll\("\.header-page-tab"\)/);
  assert.match(app, /addEventListener\("click"/);
  assert.match(app, /switchTab\(event\.currentTarget\.dataset\.view\)/);
  assert.match(app, /bind\("#mobileTeamSelect"/);
});

test("active report tab visually bridges into the report canvas", async () => {
  const layout = await readFile(new URL("../../css/layout.css", import.meta.url), "utf8");
  assert.match(layout, /body\.app-active main[\s\S]*margin-top:\s*0/);
  assert.match(layout, /header-page-tab\.active::after[\s\S]*bottom:-15px/);
  assert.match(layout, /pointer-events:none/);
});
