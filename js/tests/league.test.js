import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHistoricalTeamSummaries,
  buildPickOwnership,
  detectFuturePickHorizon,
  describeDetectedLeague,
  eligible,
  minCostLineup,
  percentile,
  riskFor,
} from "../league.js";

test("eligible enforces common lineup slot rules", () => {
  assert.equal(eligible("QB", "QB"), true);
  assert.equal(eligible("FLEX", "WR"), true);
  assert.equal(eligible("FLEX", "QB"), false);
  assert.equal(eligible("SUPER_FLEX", "QB"), true);
  assert.equal(eligible("WR_TE_FLEX", "RB"), false);
});

test("percentile ranks higher values above lower values", () => {
  assert.equal(percentile([1, 2, 3], 3), 100);
  assert.equal(percentile([1, 2, 3], 1), 0);
  assert.equal(percentile([1, 2, 3], 2), 50);
});

test("riskFor identifies a high-risk player", () => {
  const risk = riskFor({
    age: 29,
    position: "RB",
    injuryStatus: "Out",
    status: "Active",
    nflTeam: "DET",
    depthOrder: 1,
    projectedGames: 8,
    expectedPpg: 14,
    dynastyValue: 900,
  });
  assert.equal(risk.tier, "Very High");
  assert.ok(risk.score >= 60);
});

test("minCostLineup builds a legal lineup", () => {
  const players = [
    {sleeperId:"qb",position:"QB",expectedPpg:20,rosterStatus:"Starter"},
    {sleeperId:"rb",position:"RB",expectedPpg:15,rosterStatus:"Starter"},
    {sleeperId:"wr",position:"WR",expectedPpg:12,rosterStatus:"Bench"},
  ];
  const result = minCostLineup(["QB", "FLEX"], players);
  assert.equal(result.assigned.length, 2);
  assert.equal(result.assigned[0].player.position, "QB");
  assert.equal(result.assigned[1].player.position, "RB");
});

test("buildPickOwnership applies traded ownership", () => {
  const teamMap = new Map([[1, "Team One"], [2, "Team Two"]]);
  const bundle = {
    league: {season:"2026",settings:{draft_rounds:2}},
    tradedPicks: [{season:"2027",roster_id:1,round:1,owner_id:2,previous_owner_id:1}],
  };
  const picks = buildPickOwnership(bundle, 1, teamMap, {});
  const traded = picks.find((pick) => pick.originRosterId === 1 && pick.round === 1);
  assert.equal(traded.ownerRosterId, 2);
  assert.equal(traded.acquired, true);
});


test("detectFuturePickHorizon uses observed league pick seasons", () => {
  const horizon = detectFuturePickHorizon({
    league: {season:"2026"},
    tradedPicks: [{season:"2029"}],
    drafts: [{season:"2027"}],
  });
  assert.deepEqual(horizon, {
    years:3,
    startSeason:2027,
    endSeason:2029,
    source:"league data",
  });
});

test("describeDetectedLeague summarizes format, history, starters and IDP", () => {
  const league = {
    season:"2026",
    total_rosters:12,
    roster_positions:["QB","RB","WR","TE","SUPER_FLEX","LB","BN"],
  };
  const history = [
    {league:{season:"2026"}},
    {league:{season:"2025"}},
    {league:{season:"2024"}},
  ];
  const summary = describeDetectedLeague(league,"sf_ppr",history,{startSeason:2027,endSeason:2029});
  assert.equal(summary.teams,12);
  assert.equal(summary.formatLabel,"Superflex PPR");
  assert.equal(summary.starterCount,6);
  assert.equal(summary.idp,true);
  assert.equal(summary.historyStart,2024);
  assert.equal(summary.historyEnd,2026);
});


test("buildHistoricalTeamSummaries aggregates linked seasons by owner",()=>{
  const history=[
    {league:{status:"in_season",season:"2026"},rosters:[
      {roster_id:1,owner_id:"a",settings:{wins:2,losses:1,ties:0,fpts:330,fpts_decimal:50}},
      {roster_id:2,owner_id:"b",settings:{wins:1,losses:2,ties:0,fpts:300}}
    ]},
    {league:{status:"complete",season:"2025"},rosters:[
      {roster_id:4,owner_id:"a",settings:{wins:10,losses:4,ties:0,fpts:1820}},
      {roster_id:7,owner_id:"b",settings:{wins:8,losses:6,ties:0,fpts:1700}}
    ]}
  ];
  const summaries=buildHistoricalTeamSummaries(history,history[0].rosters);
  const a=summaries.get(1),b=summaries.get(2);
  assert.equal(a.seasonsMatched,2);
  assert.equal(a.completedSeasons,1);
  assert.equal(a.games,17);
  assert.equal(a.wins,12);
  assert.equal(a.losses,5);
  assert.equal(a.averageFinish,1);
  assert.equal(a.currentStanding,1);
  assert.equal(a.currentRecord,"2-1");
  assert.equal(a.historicalPpgRank,1);
  assert.equal(b.historicalPpgRank,2);
  assert.ok(a.averagePpg>b.averagePpg);
});

test("buildHistoricalTeamSummaries excludes incomplete seasons from average finish",()=>{
  const history=[{league:{status:"in_season",season:"2026"},rosters:[
    {roster_id:1,owner_id:"a",settings:{wins:0,losses:0,fpts:0}},
    {roster_id:2,owner_id:"b",settings:{wins:0,losses:0,fpts:0}}
  ]}];
  const summary=buildHistoricalTeamSummaries(history,history[0].rosters).get(1);
  assert.equal(summary.averageFinish,null);
  assert.equal(summary.games,0);
  assert.equal(summary.historicalPpgRank,null);
});

test("deriveStarterCount uses stored and roster-position fallbacks", async () => {
  const { deriveStarterCount } = await import("../league.js");
  assert.equal(deriveStarterCount({ starterCount: 10 }), 10);
  assert.equal(deriveStarterCount({ detectedSetup: { starterCount: 9 } }), 9);
  assert.equal(deriveStarterCount({ rosterSlots: ["QB","RB","RB","WR","WR","WR","TE","FLEX","FLEX","FLEX"] }), 10);
  assert.equal(deriveStarterCount({ league: { roster_positions: ["QB","RB","WR","TE","SUPER_FLEX","DL","LB","DB","BN","IR","TAXI"] } }), 8);
  assert.equal(deriveStarterCount({ teams: [
    { lineup: Array(10).fill("player") },
    { lineup: Array(10).fill("player") },
    { lineup: Array(9).fill("player") },
  ] }), 10);
  assert.equal(deriveStarterCount({}), null);
});
