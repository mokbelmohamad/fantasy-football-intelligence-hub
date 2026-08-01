"use strict";

// Browser entry point: navigation, session cleanup, sorting, and safe errors.
import { analyze, applyContenderWeights } from "./analyze.js?v=2.3.0-release";
import { clearLeagueSession } from "./api/leagueSession.js";
import { reportError, userMessage } from "./errors.js";
import { state } from "./state.js";
import { $, log } from "./utils.js";
import { drawRankChart, drawLeagueHistoryChart, renderAll, renderSettings, setSelectedTeam, showLanding, switchTab } from "./render.js?v=2.3.0-release";
import { settingsWeights } from "./views/settings.js";

const bind = (selector, eventName, handler) => {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
};

bind("#analyzeBtn", "click", () => analyze(false));
bind("#globalTeamSelect", "change", (event) => setSelectedTeam(event.currentTarget.value));
bind("#mobileTeamSelect", "change", (event) => setSelectedTeam(event.currentTarget.value));
bind("#changeLeagueBtn", "click", () => {
  clearLeagueSession();
  state.analysis = null;
  showLanding();
});

document.querySelectorAll(".header-page-tab").forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(event.currentTarget.dataset.view);
  });
});

window.addEventListener("popstate", () => {
  if (!state.analysis) return;
  switchTab(window.location.hash.replace(/^#/, "") || "dashboard", { fromHistory: true });
});

$("#leagueId").addEventListener("keydown", (event) => {
  if (event.key === "Enter") analyze(false);
});

window.addEventListener("resize", () => {
  if ($("#dashboard").classList.contains("active")) {
    drawRankChart();
    drawLeagueHistoryChart();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#applySettingsWeights")) {
    if (applyContenderWeights(settingsWeights())) {
      renderAll();
      renderSettings();
      log("Contender Index recalculated with the updated weights.", 100);
    }
    return;
  }
  const th = event.target.closest("th[data-key]");
  if (!th) return;
  const table = th.closest("table");
  const key = th.dataset.key;
  const tbody = table.querySelector("tbody");
  const rows = [...tbody.rows];
  const index = [...th.parentElement.cells].indexOf(th);
  const sortKey = table.dataset.table + ":" + key;
  const ascending = state.sort[sortKey] !== true;
  state.sort[sortKey] = ascending;
  rows.sort((a, b) => {
    const left = a.cells[index].textContent.trim().replace(/[$,%+]/g, "").replace(/,/g, "");
    const right = b.cells[index].textContent.trim().replace(/[$,%+]/g, "").replace(/,/g, "");
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const comparison = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
      ? leftNumber - rightNumber
      : left.localeCompare(right);
    return ascending ? comparison : -comparison;
  });
  rows.forEach((row) => tbody.appendChild(row));
});

window.addEventListener("pagehide", clearLeagueSession);
window.addEventListener("unhandledrejection", (event) => log(userMessage(reportError(event.reason, { source: "Unhandled promise" }))));
window.addEventListener("error", (event) => {
  if (event.error) log(userMessage(reportError(event.error, { source: "Browser runtime" })));
});
