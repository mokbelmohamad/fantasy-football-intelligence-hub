import { API } from "../config.js";
    import {
      allSettledMap,
      fetchJson,
      loadJsonSnapshot,
    } from "./http.js";

    // Walks an unknown RosterAudit response shape and builds a lookup by
    // Sleeper player ID. node is the current nested value; out is accumulated.
    export function collectProjectionPlayers(node,out=new Map()){
  if(!node||typeof node!=="object")return out;
  if(!Array.isArray(node)&&node.sleeper_id&&(node.ppg_ppr!==undefined||node.ppg!==undefined))out.set(String(node.sleeper_id),node);
  if(Array.isArray(node))node.forEach(x=>collectProjectionPlayers(x,out));else Object.values(node).forEach(x=>collectProjectionPlayers(x,out));
  return out;
}

// Sleeper has returned several response shapes over time; normalize each to rows.
export function flattenProjectionResponse(j){if(Array.isArray(j))return j;if(Array.isArray(j?.data))return j.data;if(Array.isArray(j?.projections))return j.projections;return []}

export function projectionId(row){return String(row?.player_id??row?.player?.player_id??row?.player?.id??"")}

export function field(o,names){for(const n of names)if(o&&o[n]!==undefined&&o[n]!==null&&o[n]!=="")return o[n];return null}

    // Retrieves a season's projections. If the all-player endpoint is empty,
    // retry position by position so a partial report is still possible.
    export async function loadSleeperProjections(season, sources) {
      const snapshot = await loadJsonSnapshot(
        "./data/projections.json",
        (value) => Array.isArray(value?.players) && value.players.length > 0,
      );

      let rows = snapshot?.season === Number(season)
        ? snapshot.players
        : [];

      if (!rows.length) {
        const full = `${API.projections}/${season}?season_type=regular&order_by=pts_ppr`;

        try {
          rows = flattenProjectionResponse(await fetchJson(full, 50000));
        } catch {
          rows = [];
        }
      }

      if (!rows.length) {
        const positions = ["QB", "RB", "WR", "TE", "K", "DEF", "DL", "LB", "DB"];
        const results = await allSettledMap(
          positions,
          async (position) => {
            const urls = [
              `${API.projections}/${season}?season_type=regular&position=${position}&order_by=pts_ppr`,
              `${API.projections}/${season}?season_type=regular&position[]=${position}&order_by=pts_ppr`,
            ];

            for (const url of urls) {
              try {
                const response = flattenProjectionResponse(await fetchJson(url, 30000));
                if (response.length) {
                  return response;
                }
              } catch {
                // Continue to the next endpoint variation.
              }
            }

            return [];
          },
          4,
        );

        rows = results.flatMap((result) => (
          result.status === "fulfilled" ? result.value : []
        ));
      }

      const map = new Map();
      rows.forEach((row) => {
        const id = projectionId(row);
        if (id) {
          map.set(id, row);
        }
      });

      sources.push({
        name: "Sleeper projections",
        status: map.size ? "ok" : "warn",
        detail: snapshot && rows.length
          ? `${map.size} players · snapshot`
          : `${map.size} players`,
      });

      return map;
    }
