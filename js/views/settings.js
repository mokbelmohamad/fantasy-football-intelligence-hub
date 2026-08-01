// Settings keeps ranking controls near the evidence they affect. Re-running
// weights recalculates the in-memory analysis and never repeats Sleeper calls.
import { state } from "../state.js";
import { $, esc } from "../utils.js";
import { bindHistoryEvidence, historyEvidenceMarkup } from "./history.js";
import { methodologyMarkup } from "./methodology.js";

const WEIGHTS = [
  ["projection", "Starting Lineup Projection", "Uses expected PPG from the optimal legal lineup."],
  ["depth", "Bench Depth", "Uses the strongest eligible bench options with a depth adjustment."],
  ["history", "Production", "Uses available points, max points, and record signals."],
  ["dynasty", "Dynasty Value", "Uses combined RosterAudit and DynastyProcess market values."],
  ["risk", "Low-Risk Score", "Uses age, injury/status, projected games, depth role, and value fragility."],
  ["picks", "Draft Capital", "Uses future draft-pick ownership and value."],
];

function percent(value) {
  return Math.round(Number(value || 0) * 100);
}

function weightField([key, label, help], weights) {
  return '<div class="weight-field"><label for="settingsWeight-' + key + '">' + esc(label) + '</label><input id="settingsWeight-' + key + '" type="number" min="0" max="100" value="' + percent(weights[key]) + '"><p class="field-help">' + esc(help) + '</p></div>';
}

export function settingsWeights() {
  return Object.fromEntries(WEIGHTS.map(([key]) => [key, Number($("#settingsWeight-" + key)?.value || 0)]));
}

export function renderSettings() {
  const analysis = state.analysis;
  if (!analysis) return;
  const weights = analysis.weights || {};
  const seasons = analysis.history || [];
  $("#settings").innerHTML = '<section class="panel settings-page"><div class="section-title"><div><h2>Settings</h2><div class="small">Adjust Contender Index priorities for this open analysis.</div></div></div><section class="settings-weights"><h3>Contender Index Weights</h3><p class="weight-scope">Weights normalize automatically. Running the analysis below recalculates rankings and recommendations from the already loaded session data; it does not make another Sleeper request.</p><div class="advanced-grid weight-grid">' + WEIGHTS.map((item) => weightField(item, weights)).join("") + '</div><div class="buttons"><button id="applySettingsWeights" type="button">Run Analysis with These Weights</button></div></section>' + methodologyMarkup(analysis) + historyEvidenceMarkup(seasons) + '</section>';
  bindHistoryEvidence(seasons);
}
