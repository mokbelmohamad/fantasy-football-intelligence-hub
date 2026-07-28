import { state } from "./state.js";
import {
  $,
  $$,
  csvEscape,
  esc,
  setSources,
} from "./utils.js";
import { prepareAnalysisForRender } from "./tiers.js";
import {
  renderDashboard,
  drawRankChart,
} from "./views/dashboard.js";
import {
  renderTeams,
  renderTeamDetail,
} from "./views/teams.js";
import { renderLineups } from "./views/lineups.js";
import {
  renderTrade,
  renderTradeBody,
} from "./views/trade.js";
import {
  renderPlayers,
  renderPlayerTable,
} from "./views/players.js";
import {
  renderTiers,
  renderTierBoard,
} from "./views/tiers.js";
import { renderPicks } from "./views/picks.js";
import { renderMethodology } from "./views/methodology.js";

const VALID_VIEWS = new Set([
  "dashboard",
  "teams",
  "lineups",
  "trade",
  "picks",
  "players",
  "tiers",
  "methodology",
]);

export {
  drawRankChart,
  renderDashboard,
  renderLineups,
  renderMethodology,
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
  return state.analysis.teams
    .map((team) => (
      `<option value="${esc(team.team)}" ${team.team === selected ? "selected" : ""}>`
      + `${esc(team.team)}</option>`
    ))
    .join("");
}

export function populateTeamSelectors() {
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

  const menu = $("#headerMoreMenu");
  if (menu) {
    menu.open = false;
  }

  if (next === "dashboard") {
    requestAnimationFrame(drawRankChart);
  }
}

function resolveLeagueName(analysis) {
  const historyName = Array.isArray(analysis.history)
    ? [...analysis.history].reverse().find((item) => item?.name)?.name
    : "";
  return analysis.leagueName || analysis.league?.name || historyName || "Unnamed League";
}

function leagueSettingsSummary(analysis) {
  const starters = Array.isArray(analysis.starterSlots)
    ? analysis.starterSlots.length
    : analysis.starterCount;
  const teamCount = analysis.totalRosters || analysis.teams?.length || 0;
  return [
    teamCount ? `${teamCount} teams` : "Team count unavailable",
    analysis.formatLabel || "Format unavailable",
    starters ? `Start ${starters}` : "Starter count unavailable",
  ].filter(Boolean).join(" · ");
}

export function updateHeaderContext() {
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
  $("#activeLeagueId").textContent = `Sleeper ID: ${state.analysis.leagueId || "Unavailable"}`;
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
    mobileDataStatus.textContent = `${statusNode.textContent} · Version 2.2`;
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
  $("#exportPanel").classList.remove("hidden");
  document.body.classList.add("app-active");

  switchTab(viewFromLocation(), { replaceHistory: !window.location.hash });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showLanding() {
  $("#appShell").classList.add("hidden");
  $("#headerAppControls").classList.add("hidden");
  $("#headerPageTabs").classList.add("hidden");
  $("#exportPanel").classList.add("hidden");
  $("#landingPage").classList.remove("hidden");
  document.body.classList.remove("app-active");
  window.history.replaceState({}, "", window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => $("#leagueId").focus(), 150);
}

export function setSelectedTeam(teamName) {
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
  populateTeamSelectors();
  renderDashboard();
  renderTeams();
  renderLineups();
  renderTrade();
  renderPlayers();
  renderTiers();
  renderPicks();
  renderMethodology();
  setSources(state.analysis.sourceStatuses || []);
  updateHeaderContext();
}

export function csvFrom(rows, columns) {
  return [
    columns.map((column) => csvEscape(column.label)).join(","),
    ...rows.map((row) => (
      columns
        .map((column) => (
          csvEscape(
            typeof column.get === "function"
              ? column.get(row)
              : row[column.key],
          )
        ))
        .join(",")
    )),
  ].join("\n");
}
