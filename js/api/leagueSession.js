// Session-only league evidence. Submitted league IDs remain inside this module
// and disappear when the tab closes or the user changes leagues.
import {
  getDraftEvidence,
  getLeagueDrafts,
  getMatchups,
  getPlayoffBrackets,
  getSeasonRosterBundle,
  getTransactions,
} from "./sleeper.js";

export const LEAGUE_RESOURCE_MANIFEST = Object.freeze({
  dashboard: { depth: "current", resources: ["currentMatchups"] },
  teams: { depth: "all", resources: ["seasonRosters", "matchups"] },
  picks: { depth: "selected", resources: ["drafts", "draftDetails", "draftPicks", "draftTradedPicks"] },
  history: { depth: "selected", resources: ["transactions", "matchups", "winnersBracket", "losersBracket", "drafts", "draftDetails", "draftPicks", "draftTradedPicks"] },
});

let activeSession = null;

function seasonKey(season) {
  return String(season?.season || "");
}

function cache(key, loader) {
  if (!activeSession) return Promise.reject(new Error("No active league session."));
  if (!activeSession.cache.has(key)) activeSession.cache.set(key, Promise.resolve().then(loader));
  return activeSession.cache.get(key);
}

export function beginLeagueSession(currentBundle, seasonIndex, currentMatchups, currentWeek) {
  const seasons = new Map();
  (seasonIndex || []).forEach((entry) => {
    const league = entry?.league || entry;
    const key = seasonKey(league);
    if (key) seasons.set(key, { id: String(league.league_id), league });
  });
  activeSession = {
    currentBundle,
    currentMatchups: currentMatchups || {},
    currentWeek,
    seasons,
    cache: new Map(),
  };
}

export function clearLeagueSession() {
  activeSession = null;
}

export function publicSeasonIndex() {
  if (!activeSession) return [];
  return [...activeSession.seasons.values()]
    .map(({ league }) => ({
      season: Number(league.season),
      name: league.name || "Unnamed season",
      status: league.status || "unknown",
    }))
    .sort((a, b) => b.season - a.season);
}

function entryFor(season) {
  const entry = activeSession?.seasons.get(String(season));
  if (!entry) throw new Error("Selected season is unavailable in this session.");
  return entry;
}

export async function loadSeasonEvidence(season, onProgress = () => {}) {
  const entry = entryFor(season);
  const key = "history:" + season;
  return cache(key, async () => {
    onProgress("Loading " + season + " season evidence…");
    const [transactions, matchups, brackets, drafts] = await Promise.all([
      getTransactions(entry.id),
      getMatchups(entry.id, 17),
      getPlayoffBrackets(entry.id),
      getLeagueDrafts(entry.id).catch(() => []),
    ]);
    onProgress("Loading " + season + " draft details…");
    const draftEvidence = await getDraftEvidence(drafts);
    const expectedWeeks = entry.league.status === "complete" ? 17 : activeSession.currentWeek;
    const matchupFailures = expectedWeeks > 0 && Object.keys(matchups).length < expectedWeeks
      ? ["Some completed matchup weeks are unavailable."]
      : [];
    return {
      season: Number(season),
      transactions: transactions.transactions,
      matchups,
      winnersBracket: brackets.winners,
      losersBracket: brackets.losers,
      drafts: draftEvidence,
      failures: [...transactions.failures, ...brackets.failures, ...matchupFailures, ...draftEvidence.filter((item) => item.error).map((item) => item.error)],
    };
  });
}

export async function loadAllTeamHistory(onProgress = () => {}) {
  if (!activeSession) throw new Error("No active league session.");
  return cache("teams:all-history", async () => {
    const bundles = [activeSession.currentBundle];
    const matchups = new Map([[String(activeSession.currentBundle.league.league_id), activeSession.currentMatchups]]);
    const failures = [];
    const prior = [...activeSession.seasons.values()]
      .filter((entry) => String(entry.league.league_id) !== String(activeSession.currentBundle.league.league_id));
    for (const entry of prior) {
      onProgress("Loading " + entry.league.season + " team history…");
      const [bundle, seasonMatchups] = await Promise.all([
        getSeasonRosterBundle(entry.id),
        getMatchups(entry.id, 17),
      ]);
      bundles.push(bundle);
      matchups.set(String(entry.id), seasonMatchups);
      const expectedWeeks = entry.league.status === "complete" ? 17 : activeSession.currentWeek;
      if (expectedWeeks > 0 && Object.keys(seasonMatchups).length < expectedWeeks) {
        failures.push(entry.league.season + " matchup history is partial.");
      }
    }
    return { bundles, matchups, failures };
  });
}
