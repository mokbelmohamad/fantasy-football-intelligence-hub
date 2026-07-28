import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPlayerTierModel } from "../tiers.js";

const fixtureUrl = new URL("./fixtures/sample-analysis.json", import.meta.url);

test("tier model assigns scores and sorts descending", async () => {
  const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
  const tiers = buildPlayerTierModel(fixture.players);
  assert.equal(tiers.length, 3);
  assert.ok(tiers.every((player) => player.analysisTier));
  assert.ok(tiers.every((player) => Number.isFinite(player.tierComposite)));
  for (let index = 1; index < tiers.length; index += 1) {
    assert.ok(tiers[index - 1].tierComposite >= tiers[index].tierComposite);
  }
});

test("tier model excludes inactive players without signals", () => {
  const tiers = buildPlayerTierModel([{
    sleeperId:"inactive",name:"Inactive",position:"WR",status:"inactive",
    expectedPpg:0,projectedTotal:0,dynastyValue:0,
  }]);
  assert.deepEqual(tiers, []);
});

import { buildTeamInsights } from "../tiers.js";

test("team insights include an expanded championship recommendation", () => {
  const makeTeam=(id,rank,scores)=>({
    rosterId:id,currentRank:rank,franchiseRank:rank,lineupPpg:130-rank*2,depth:10-rank,
    depthPct:rank===1?90:40,riskPct:70,picksPct:50,youngPct:60,totalValue:10000,
    risk:20,highRiskStarters:0,futureFirsts:1,pickCapital:1000,picksOwned:[],bench:[],players:[],lineup:[],
    positionScores:scores,positionRanks:{QB:rank,RB:rank,WR:rank,TE:rank,FLEX:rank}
  });
  const teams=[
    makeTeam(1,1,{QB:20,RB:30,WR:45,TE:12,FLEX:25}),
    makeTeam(2,2,{QB:18,RB:28,WR:40,TE:10,FLEX:22}),
    makeTeam(3,3,{QB:16,RB:25,WR:35,TE:8,FLEX:20}),
  ];
  const insights=buildTeamInsights(teams[0],teams);
  assert.ok(insights.championshipOutlook.title);
  assert.equal(insights.positionReviews.length,7);
  assert.deepEqual(insights.positionReviews.slice(0,5).map(r=>r.key),["QB","RB","WR","TE","FLEX"]);
  assert.ok(insights.championshipOutlook.explanation.length>300);
  assert.equal("moves" in insights.championshipOutlook,false);
});
