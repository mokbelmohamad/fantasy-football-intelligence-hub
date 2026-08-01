// Lazy evidence browser for one linked Sleeper season. Identifiers stay in the
// session loader; this page displays only the returned season evidence.
import { loadSeasonEvidence } from "../api/leagueSession.js";
import { state } from "../state.js";
import { $, esc, log } from "../utils.js";

function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["creator", "user_id", "picked_by"].includes(key))
    .map(([key, item]) => [key, scrub(item)]));
}

function evidenceText(evidence) {
  return esc(JSON.stringify(scrub(evidence), null, 2));
}

export function historyEvidenceMarkup(seasons) {
  return '<details class="settings-history"><summary>League History Evidence</summary><div class="settings-history-content"><div class="section-title"><div><h3>League History Evidence</h3><div class="small">Load one linked season at a time. The session cache prevents repeat Sleeper calls until this tab closes.</div></div><label class="league-history-control">Season<select id="historySeason">' + seasons.map((item) => '<option value="' + esc(item.season) + '">' + esc(item.season) + ' · ' + esc(item.name) + '</option>').join("") + '</select></label></div><div id="historyBody" class="history-loading"><p class="small">Open this section to load transactions, trades, drafts, picks, matchups, and playoff brackets.</p></div></div></details>';
}

export function bindHistoryEvidence(seasons) {
  let loaded = false;
  const loadSelectedSeason = () => {
    if (!loaded && seasons.length) {
      loaded = true;
      void loadHistorySeason(seasons[0].season);
    }
  };
  $(".settings-history")?.addEventListener("toggle", (event) => {
    if (event.currentTarget.open) loadSelectedSeason();
  });
  $("#historySeason")?.addEventListener("change", (event) => {
    loaded = true;
    void loadHistorySeason(event.currentTarget.value);
  });
}

export async function loadHistorySeason(season) {
  const body = $("#historyBody");
  if (!body) return;
  body.innerHTML = '<p class="small">Loading selected season evidence…</p>';
  try {
    const evidence = await loadSeasonEvidence(season, (message) => log(message));
    if ($("#historySeason")?.value !== String(season)) return;
    const warnings = evidence.failures?.length ? '<div class="callout warn"><strong>Partial history:</strong> ' + esc(evidence.failures.join(" ")) + '</div>' : "";
    body.innerHTML = warnings + '<details open class="history-raw"><summary>Returned Sleeper evidence</summary><pre>' + evidenceText(evidence) + '</pre></details>';
  } catch {
    body.innerHTML = '<div class="callout warn">This season could not be loaded. Missing upstream history is not replaced with fabricated zeros.</div>';
  }
}
