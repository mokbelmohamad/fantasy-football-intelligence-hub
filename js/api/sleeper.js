import { API } from "../config.js";
import { idbGet, idbSet } from "../storage.js";
import { todayKey } from "../utils.js";
import {
  allSettledMap,
  fetchJson,
  loadJsonSnapshot,
} from "./http.js";

// The fantasy league concludes with its Week 17 championship. NFL Week 18 is
// outside the fantasy schedule and must never affect team performance data.
const LAST_LEAGUE_WEEK = 17;

export async function getNflState() {
  return fetchJson(`${API.sleeper}/state/nfl`);
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

  const players = await fetchJson(`${API.sleeper}/players/nfl`, 90000);
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
    fetchJson(`${API.sleeper}/league/${id}`),
    fetchJson(`${API.sleeper}/league/${id}/users`),
    fetchJson(`${API.sleeper}/league/${id}/rosters`),
    fetchJson(`${API.sleeper}/league/${id}/traded_picks`).catch(() => []),
    fetchJson(`${API.sleeper}/league/${id}/drafts`).catch(() => []),
  ]);

  return {
    league,
    users,
    rosters,
    tradedPicks,
    drafts,
  };
}

export async function getHistory(currentBundle, depth) {
  // Follow Sleeper's linked previous_league_id chain up to the requested depth.
  const history = [currentBundle];
  let id = currentBundle.league.previous_league_id;

  while (id && id !== "0" && history.length <= depth) {
    try {
      const bundle = await getLeagueBundle(id);
      history.push(bundle);
      id = bundle.league.previous_league_id;
    } catch {
      break;
    }
  }

  return history;
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
    (week) => fetchJson(`${API.sleeper}/league/${leagueId}/matchups/${week}`),
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

// Collect matchup records for every linked season. The current season's data is
// reused rather than fetched twice; older seasons are limited to two concurrent
// leagues to avoid overwhelming Sleeper while still keeping the report usable.
export async function getHistoryMatchups(history, currentMatchups, currentMaxWeek) {
  const byLeagueId = new Map();
  const current = history?.[0];
  if (current?.league?.league_id) {
    byLeagueId.set(String(current.league.league_id), currentMatchups || {});
  }

  const previous = (history || []).slice(1);
  const results = await allSettledMap(previous, async (bundle) => {
    const leagueId = String(bundle?.league?.league_id || "");
    if (!leagueId) return { leagueId, matchups: {} };
    const maxWeek = bundle.league.status === "complete" ? LAST_LEAGUE_WEEK : currentMaxWeek;
    return { leagueId, matchups: await getMatchups(leagueId, maxWeek) };
  }, 2);

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.leagueId) {
      byLeagueId.set(result.value.leagueId, result.value.matchups);
    }
  });
  return byLeagueId;
}
