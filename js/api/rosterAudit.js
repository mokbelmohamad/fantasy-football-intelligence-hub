import { API } from "../config.js";
import {
  fetchJson,
  loadJsonSnapshot,
} from "./http.js";

async function snapshotFile(path, validator) {
  // Keeps the three loaders below consistent when checking local snapshot data.
  return loadJsonSnapshot(path, validator);
}

export async function loadRosterAuditValues(formatKey) {
  // formatKey selects the relevant scoring-market values (1QB, Superflex, etc.).
  const snapshot = await snapshotFile(
    "./data/dynasty-values.json",
    (value) => Object.keys(value?.formats?.[formatKey] || {}).length > 0,
  );

  if (snapshot) {
    return {
      data: snapshot.formats[formatKey],
      source: "snapshot",
    };
  }

  return {
    data: await fetchJson(
      `${API.raValues}?format_key=${encodeURIComponent(formatKey)}`,
      45000,
    ),
    source: "live",
  };
}

export async function loadRosterAuditProjections() {
  const snapshot = await snapshotFile(
    "./data/roster-audit-projections.json",
    (value) => value?.data && Object.keys(value.data).length > 0,
  );

  if (snapshot) {
    return {
      data: snapshot.data,
      source: "snapshot",
    };
  }

  return {
    data: await fetchJson(API.raProjections, 45000),
    source: "live",
  };
}

export async function loadRosterAuditPicks() {
  const snapshot = await snapshotFile(
    "./data/pick-values.json",
    (value) => value?.data && Object.keys(value.data).length > 0,
  );

  if (snapshot) {
    return {
      data: snapshot.data,
      source: "snapshot",
    };
  }

  return {
    data: await fetchJson(API.raPicks, 45000),
    source: "live",
  };
}
