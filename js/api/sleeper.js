import { API } from "../config.js";
import { idbGet, idbSet } from "../storage.js";
import { todayKey } from "../utils.js";
import {
  allSettledMap,
  fetchJsonWithRetry,
  loadJsonSnapshot,
} from "./http.js";

// The fantasy league concludes with its Week 17 championship. NFL Week 18 is
// outside the fantasy schedule and must never affect team performance data.
const LAST_LEAGUE_WEEK = 17;

export async function getNflState() {
  return fetchJsonWithRetry(`${API.sleeper}/state/nfl`);
}

export async function loadPlayerDirectory(force, sources) {
  // Prefer the checked-in snapshot, then today's browser cache, before asking
  // Sleeper live. force skips both caches at the user's request.
  const snapshot = !force
    ? await loadJsonSnapshot(
        "./data/players.json",
        (value) => Object.keys(value?.players || value || {}).length > 0,
      )
    : null;

  if (snapshot) {
    sources.push({
      name: "Sleeper players",
      status: "ok",
      detail: "local snapshot",
    });
    return snapshot.players || snapshot;
  }

  const key = `players:${todayKey()}`;
  if (!force) {
    const cached = await idbGet(key);
    if (cached) {
      sources.push({
        name: "Sleeper players",
        status: "ok",
        detail: "daily cache",
      });
      return cached;
    }
  }

  const players = await fetchJsonWithRetry(`${API.sleeper}/players/nfl`, 90000);
  await idbSet(key, players);
  sources.push({
    name: "Sleeper players",
    status: "ok",
    detail: "live",
  });
  return players;
}

export async function getLeagueBundle(id) {
  // A "bundle" groups all Sleeper records required to analyze one league.
  const [league, users, rosters, tradedPicks, drafts] = await Promise.all([
    fetchJsonWithRetry(`${API.sleeper}/league/${id}`),
    fetchJsonWithRetry(`${API.sleeper}/league/${id}/users`),
    fetchJsonWithRetry(`${API.sleeper}/league/${id}/rosters`),
    fetchJsonWithRetry(`${API.sleeper}/league/${id}/traded_picks`).catch(() => []),
    fetchJsonWithRetry(`${API.sleeper}/league/${id}/drafts`).catch(() => []),
  ]);

  return {
    league,
    users,
    rosters,
    tradedPicks,
    drafts,
  };
}

export async function getLeagueMetadata(id) {
  return fetchJsonWithRetry(API.sleeper + "/league/" + id);
}

export async function getSeasonRosterBundle(id) {
  const [league, users, rosters] = await Promise.all([
    getLeagueMetadata(id),
    fetchJsonWithRetry(API.sleeper + "/league/" + id + "/users"),
    fetchJsonWithRetry(API.sleeper + "/league/" + id + "/rosters"),
  ]);
  return { league, users, rosters };
}

export async function getSeasonIndex(currentLeague, depth = 20) {
  // Linked seasons must be discovered in order because each league points to
  // its predecessor. Only metadata is loaded here; detailed evidence waits for
  // the page that needs it.
  const seasons = [{ league: currentLeague }];
  const failures = [];
  let id = currentLeague.previous_league_id;

  while (id && id !== "0" && seasons.length <= depth) {
    try {
      const league = await getLeagueMetadata(id);
      seasons.push({ league });
      id = league.previous_league_id;
    } catch {
      failures.push("A linked season could not be indexed.");
      break;
    }
  }

  return { seasons, failures };
}

export async function getMatchups(leagueId, maxWeek) {
  // Sleeper exposes one week per request, so collect each completed week.
  // Enforce the fantasy championship cutoff regardless of caller input.
  const completedWeek = Math.min(Math.max(Number(maxWeek) || 0, 0), LAST_LEAGUE_WEEK);
  if (completedWeek < 1) {
    return {};
  }

  const weeks = Array.from({ length: completedWeek }, (_, index) => index + 1);
  const results = await allSettledMap(
    weeks,
    (week) => fetchJsonWithRetry(`${API.sleeper}/league/${leagueId}/matchups/${week}`),
    6,
  );

  const matchups = {};
  results.forEach((result, index) => {
    if (
      result.status === "fulfilled"
      && Array.isArray(result.value)
      && result.value.length
    ) {
      matchups[weeks[index]] = result.value;
    }
  });

  return matchups;
}

export async function getTransactions(leagueId) {
  // Sleeper has no season transaction index. Request every public round,
  // including round 0 for offseason activity, without treating an empty round
  // as an error.
  const rounds = Array.from({ length: 19 }, (_, index) => index);
  const results = await allSettledMap(
    rounds,
    (round) => fetchJsonWithRetry(API.sleeper + "/league/" + leagueId + "/transactions/" + round),
    4,
  );
  const transactions = {};
  const failures = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      transactions[rounds[index]] = result.value;
    } else if (result.status === "rejected") {
      failures.push("Transaction round " + rounds[index] + " could not be loaded.");
    }
  });
  return { transactions, failures };
}

export async function getLeagueDrafts(leagueId) {
  return fetchJsonWithRetry(API.sleeper + "/league/" + leagueId + "/drafts");
}

export async function getDraftEvidence(drafts) {
  const results = await allSettledMap(drafts || [], async (draft) => {
    const id = String(draft?.draft_id || "");
    if (!id) return { draft, detail: null, picks: [], tradedPicks: [], error: "Missing draft identifier." };
    const [detail, picks, tradedPicks] = await Promise.allSettled([
      fetchJsonWithRetry(API.sleeper + "/draft/" + id),
      fetchJsonWithRetry(API.sleeper + "/draft/" + id + "/picks"),
      fetchJsonWithRetry(API.sleeper + "/draft/" + id + "/traded_picks"),
    ]);
    return {
      draft,
      detail: detail.status === "fulfilled" ? detail.value : null,
      picks: picks.status === "fulfilled" && Array.isArray(picks.value) ? picks.value : [],
      tradedPicks: tradedPicks.status === "fulfilled" && Array.isArray(tradedPicks.value) ? tradedPicks.value : [],
      error: [detail, picks, tradedPicks].some((item) => item.status === "rejected")
        ? "Some draft evidence is unavailable."
        : "",
    };
  }, 2);
  return results.map((result) => result.status === "fulfilled"
    ? result.value
    : { draft: null, detail: null, picks: [], tradedPicks: [], error: "Draft evidence could not be loaded." });
}

export async function getPlayoffBrackets(leagueId) {
  const [winners, losers] = await Promise.allSettled([
    fetchJsonWithRetry(API.sleeper + "/league/" + leagueId + "/winners_bracket"),
    fetchJsonWithRetry(API.sleeper + "/league/" + leagueId + "/losers_bracket"),
  ]);
  return {
    winners: winners.status === "fulfilled" && Array.isArray(winners.value) ? winners.value : [],
    losers: losers.status === "fulfilled" && Array.isArray(losers.value) ? losers.value : [],
    failures: [winners, losers].filter((item) => item.status === "rejected").length
      ? ["One or more playoff brackets are unavailable."]
      : [],
  };
}
