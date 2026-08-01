import test from "node:test";
import assert from "node:assert/strict";
import { leagueHistorySeries } from "../views/dashboard.js";
import { gapToLeaderLabel } from "../views/shared.js";
import { state } from "../state.js";

test("League history plots reported weekly scores for every team and every week",()=>{
  const analysis={teams:[
    {rosterId:1,team:"Focused",weeklyHistory:[{season:2024,complete:true,weekly:[{week:1,points:105},{week:2,points:0},{week:18,points:190}]}]},
    {rosterId:2,team:"Other",weeklyHistory:[{season:2024,complete:true,weekly:[{week:1,points:96},{week:2,points:122}]}]},
  ]};
  state.selectedTeam="Focused";
  const weekly=leagueHistorySeries(analysis,"weekly");
  assert.equal(weekly.series.length,2);
  assert.deepEqual(weekly.slots,[{season:2024,week:1},{season:2024,week:2}]);
  assert.equal(weekly.series.find(item=>item.focused).points[1].value,0);
  const record=leagueHistorySeries(analysis,"record");
  assert.deepEqual(record.slots,[{season:2024}]);
});

test("EPPG gap displays a plus when a lower-ranked contender projects ahead", () => {
  assert.equal(gapToLeaderLabel(144.56, 148.86), "+4.30");
  assert.equal(gapToLeaderLabel(148.86, 144.56), "-4.30");
});
