import { API } from "../config.js";
import { idbGet, idbSet } from "../storage.js";
import { todayKey } from "../utils.js";
import {
  allSettledMap,
  fetchJson,
  loadJsonSnapshot,
} from "./http.js";

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
  if (maxWeek < 1) {
    return {};
  }

  const weeks = Array.from({ length: maxWeek }, (_, index) => index + 1);
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
