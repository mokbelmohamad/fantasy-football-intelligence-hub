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

  const globalSelect = $("#globalTeamSelect");
  if (globalSelect) {
    globalSelect.innerHTML = teamSelectOptions(state.selectedTeam);
    globalSelect.value = state.selectedTeam;
  }
}

export function switchTab(name) {
  $$(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });

  $$(".view").forEach((view) => {
    view.classList.toggle("active", view.id === name);
  });

  if (name === "dashboard") {
    requestAnimationFrame(drawRankChart);
  }
}

export function showDashboardShell() {
  if (!state.analysis) {
    return;
  }

  prepareAnalysisForRender(state.analysis);
  populateTeamSelectors();

  $("#landingPage").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#headerAppControls").classList.remove("hidden");
  $("#tabs").classList.remove("hidden");
  $("#exportPanel").classList.remove("hidden");
  $("#activeLeagueName").textContent = state.analysis.leagueName || "League Dashboard";
  $("#activeLeagueMeta").textContent = (
    `ID ${state.analysis.leagueId} | ${state.analysis.formatLabel} | `
    + `${state.analysis.totalRosters} teams | Updated `
    + new Date(state.analysis.generatedAt).toLocaleString()
  );

  switchTab("dashboard");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showLanding() {
  $("#appShell").classList.add("hidden");
  $("#headerAppControls").classList.add("hidden");
  $("#tabs").classList.add("hidden");
  $("#exportPanel").classList.add("hidden");
  $("#landingPage").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => $("#leagueId").focus(), 150);
}

export function setSelectedTeam(teamName) {
  if (!state.analysis?.teams?.some((team) => team.team === teamName)) {
    return;
  }

  state.selectedTeam = teamName;
  const globalSelect = $("#globalTeamSelect");

  if (globalSelect) {
    globalSelect.value = teamName;
  }

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
