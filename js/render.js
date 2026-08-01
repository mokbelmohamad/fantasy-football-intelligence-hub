// Rendering coordinator: converts an already-calculated analysis into screen
// content. It never calls external APIs or changes the report's scoring rules.
import { state } from "./state.js";
import { APP_VERSION } from "./config.js";
import { buildHistoricalTeamSummaries, buildHistoricalTeamWeeklyPpg, deriveStarterCount, scoringFormatLabel } from "./league.js";
import { loadAllTeamHistory } from "./api/leagueSession.js";
import {
  $,
  $$,
  esc,
  log,
  setSources,
} from "./utils.js";
import { prepareAnalysisForRender } from "./tiers.js";
import {
  renderDashboard,
  drawRankChart,
  drawLeagueHistoryChart,
} from "./views/dashboard.js?v=2.3.0";
import {
  renderTeams,
  renderTeamDetail,
} from "./views/teams.js?v=2.3.0";
import { renderLineups } from "./views/lineups.js?v=2.3.0";
import {
  renderTrade,
  renderTradeBody,
} from "./views/trade.js?v=2.3.0";
import {
  renderPlayers,
  renderPlayerTable,
} from "./views/players.js?v=2.3.0";
import {
  renderTiers,
  renderTierBoard,
} from "./views/tiers.js?v=2.3.0";
import { renderPicks } from "./views/picks.js?v=2.3.0";
import { renderSettings } from "./views/settings.js?v=2.3.0";

const VALID_VIEWS = new Set([
  "dashboard",
  "teams",
  "lineups",
  "trade",
  "picks",
  "players",
  "tiers",
  "settings",
]);

export {
  drawRankChart,
  drawLeagueHistoryChart,
  renderDashboard,
  renderLineups,
  renderSettings,
  renderPicks,
  renderPlayers,
  renderPlayerTable,
  renderTeamDetail,
  renderTeams,
  renderTierBoard,
  renderTiers,
  renderTrade,
  renderTradeBody,
};

export function teamSelectOptions(selected) {
  // selected is the focused team; its option is marked so both pickers match.
  return state.analysis.teams
    .map((team) => (
      `<option value="${esc(team.team)}" ${team.team === selected ? "selected" : ""}>`
      + `${esc(team.team)}</option>`
    ))
    .join("");
}

export function populateTeamSelectors() {
  // Synchronizes desktop and mobile pickers after loading or switching reports.
  const first = state.analysis?.teams?.[0]?.team || "";

  if (!state.analysis?.teams?.some((team) => team.team === state.selectedTeam)) {
    state.selectedTeam = first;
  }

  [$("#globalTeamSelect"), $("#mobileTeamSelect")].filter(Boolean).forEach((select) => {
    select.innerHTML = teamSelectOptions(state.selectedTeam);
    select.value = state.selectedTeam;
  });
}

function viewFromLocation() {
  const hash = window.location.hash.replace(/^#/, "");
  if (VALID_VIEWS.has(hash)) {
    return hash;
  }

  const saved = window.localStorage.getItem("ffih-active-view");
  return VALID_VIEWS.has(saved) ? saved : "dashboard";
}

export function switchTab(name, options = {}) {
  // name is the view/tab ID. fromHistory avoids duplicate Back/Forward entries.
  const next = VALID_VIEWS.has(name) ? name : "dashboard";

  $$(".view").forEach((view) => {
    view.classList.toggle("active", view.id === next);
  });

  $$(".header-page-tab").forEach((tab) => {
    const active = tab.dataset.view === next;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-current", active ? "page" : "false");
  });

  state.activeView = next;
  window.localStorage.setItem("ffih-active-view", next);

  if (!options.fromHistory && window.location.hash !== `#${next}`) {
    const method = options.replaceHistory ? "replaceState" : "pushState";
    window.history[method]({ view: next }, "", `#${next}`);
  }

  if (next === "dashboard") {
    requestAnimationFrame(drawRankChart);
  }
  if (next === "teams") void hydrateTeamHistory();
  if (next === "settings") renderSettings();
}

function resolveLeagueName(analysis) {
  const historyName = Array.isArray(analysis.history)
    ? [...analysis.history].reverse().find((item) => item?.name)?.name
    : "";
  return analysis.leagueName || analysis.league?.name || historyName || "Unnamed League";
}

function cleanFormatLabel(value) {
  const cleaned = String(value || "")
    .replace(/\s*[·|,-]?\s*starter\s*count\s*(?:is\s*)?unavailable\s*/gi, " ")
    .replace(/\s*[·|,-]?\s*start\s*(?:count\s*)?unavailable\s*/gi, " ")
    .replace(/\s*·\s*·\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Format unavailable";
}

export function leagueSettingsSummary(analysis) {
  // Derives a short safe header summary even for reports saved by older versions.
  const starters = deriveStarterCount(analysis);
  const teamCount = analysis.totalRosters || analysis.teams?.length || 0;
  const canonicalFormat = analysis.formatKey
    ? scoringFormatLabel(analysis.formatKey)
    : cleanFormatLabel(analysis.formatLabel);
  return [
    teamCount ? `${teamCount} teams` : "Team count unavailable",
    canonicalFormat,
    starters ? `Start ${starters}` : null,
  ].filter(Boolean).join(" · ");
}

export function updateHeaderContext() {
  // Rewrites the shared header to reflect the active report and focused roster.
  if (!state.analysis) {
    return;
  }

  const historySeasons = (state.analysis.history || [])
    .map((item) => Number(item.season))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const historyStart = historySeasons[0] || Number(state.analysis.season);
  const historyEnd = historySeasons.at(-1) || Number(state.analysis.season);
  const seasonCount = historySeasons.length || (state.analysis.season ? 1 : 0);
  const historyLabel = historyStart && historyEnd
    ? `Active ${historyStart}–${historyEnd} · ${seasonCount} season${seasonCount === 1 ? "" : "s"}`
    : "Years active unavailable";
  const leagueName = resolveLeagueName(state.analysis);

  $("#activeLeagueName").textContent = `League: ${leagueName}`;
  $("#activeLeagueSettings").textContent = leagueSettingsSummary(state.analysis);
  $("#activeLeagueHistory").textContent = historyLabel;
  $("#activeLeagueUpdated").textContent = (
    `Analysis updated ${new Date(state.analysis.generatedAt).toLocaleString()}`
  );

  const sourceStatuses = state.analysis.sourceStatuses || [];
  const failed = sourceStatuses.filter((item) => item.status === "error" || item.ok === false).length;
  const statusNode = $("#headerDataStatus");
  statusNode.textContent = failed ? `${failed} source warning${failed === 1 ? "" : "s"}` : "Data ready";
  statusNode.classList.toggle("warn", failed > 0);
  const mobileLeagueName = $("#mobileLeagueName");
  const mobileLeagueSettings = $("#mobileLeagueSettings");
  const mobileLeagueUpdated = $("#mobileLeagueUpdated");
  const mobileDataStatus = $("#mobileDataStatus");

  if (mobileLeagueName) {
    mobileLeagueName.textContent = `League: ${leagueName}`;
  }
  if (mobileLeagueSettings) {
    mobileLeagueSettings.textContent = leagueSettingsSummary(state.analysis);
  }
  if (mobileLeagueUpdated) {
    mobileLeagueUpdated.textContent = `Analysis updated ${new Date(state.analysis.generatedAt).toLocaleString()}`;
  }
  if (mobileDataStatus) {
    mobileDataStatus.textContent = `${statusNode.textContent} · Version ${APP_VERSION}`;
  }
}

export function showDashboardShell() {
  if (!state.analysis) {
    return;
  }

  prepareAnalysisForRender(state.analysis);
  populateTeamSelectors();
  updateHeaderContext();

  $("#landingPage").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#headerAppControls").classList.remove("hidden");
  $("#headerPageTabs").classList.remove("hidden");
  document.body.classList.add("app-active");

  switchTab(viewFromLocation(), { replaceHistory: !window.location.hash });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showLanding() {
  $("#appShell").classList.add("hidden");
  $("#headerAppControls").classList.add("hidden");
  $("#headerPageTabs").classList.add("hidden");
  $("#landingPage").classList.remove("hidden");
  document.body.classList.remove("app-active");
  window.history.replaceState({}, "", window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => $("#leagueId").focus(), 150);
}

export function setSelectedTeam(teamName) {
  // Stores the focus selection, updates both controls, and redraws dependent tabs.
  if (!state.analysis?.teams?.some((team) => team.team === teamName)) {
    return;
  }

  state.selectedTeam = teamName;
  [$("#globalTeamSelect"), $("#mobileTeamSelect")].filter(Boolean).forEach((select) => {
    select.value = teamName;
  });

  renderDashboard();
  renderTeams();
  renderLineups();
  renderTrade();
  renderPlayers();
  renderTiers();
  renderPicks();
}

export function renderAll() {
  // Every renderer reads the same state.analysis snapshot.
  populateTeamSelectors();
  renderDashboard();
  renderTeams();
  renderLineups();
  renderTrade();
  renderPlayers();
  renderTiers();
  renderPicks();
  setSources(state.analysis.sourceStatuses || []);
  updateHeaderContext();
}

async function hydrateTeamHistory() {
  if (!state.analysis || state.analysis.deepHistoryLoaded) return;
  try {
    log("Loading linked-team history…");
    const result = await loadAllTeamHistory((message) => log(message));
    const summaries = buildHistoricalTeamSummaries(result.bundles, result.bundles[0].rosters);
    const weekly = buildHistoricalTeamWeeklyPpg(result.bundles, result.matchups, result.bundles[0].rosters);
    state.analysis.teams.forEach((team) => {
      team.historical = summaries.get(team.rosterId) || team.historical;
      team.weeklyHistory = weekly.get(team.rosterId) || team.weeklyHistory;
    });
    if (result.failures.length) {
      state.analysis.sourceStatuses = [
        ...(state.analysis.sourceStatuses || []).filter((item) => item.name !== "Linked team history"),
        { name: "Linked team history", status: "warn", detail: "partially available" },
      ];
      setSources(state.analysis.sourceStatuses);
    }
    state.analysis.deepHistoryLoaded = true;
    renderTeams();
    renderDashboard();
  } catch {
    state.analysis.historyUnavailable = true;
    state.analysis.sourceStatuses = [
      ...(state.analysis.sourceStatuses || []).filter((item) => item.name !== "Linked team history"),
      { name: "Linked team history", status: "warn", detail: "unavailable" },
    ];
    setSources(state.analysis.sourceStatuses);
    renderTeams();
  }
}
