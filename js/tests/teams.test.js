import test from "node:test";
import assert from "node:assert/strict";
import { teamInsightsMarkup } from "../views/teams.js";

function team(overrides={}) {
  return {
    rosterId:1,team:"Focused Team",currentRank:2,currentClass:"Strong Contender",
    lineupPpg:121.5,depth:14,totalValue:11000,risk:21,futureFirsts:2,
    historical:{seasonsMatched:2,wins:14,losses:10,ties:0,averagePpg:111.2},
    weeklyHistory:[{season:2025,complete:true,weekly:[{week:1,ppg:110}],wins:8,losses:6,ties:0,ppg:110}],
    lineup:[{slot:"QB",player:{name:"Quarterback",position:"QB",positionTier:"Tier 1",positionRank:1,positionPoolSize:24,expectedPpg:20,projectedTotal:340,dynastyValue:5000,riskTier:"Low"}}],
    insights:{
      championshipOutlook:{title:"Hold the core.",explanation:"Keep the core together.",metrics:[{label:"Gap to #1",value:"1.5 EPPG"}]},
      strengths:[{title:"QB advantage",summary:"An edge.",metrics:[{label:"Rank",value:"1st"}]}],
      weaknesses:[{title:"Depth",summary:"Improve depth.",metrics:[{label:"Rank",value:"8th"}]}],
      positionReviews:[{label:"Quarterback",status:"Strong",action:"Hold",summary:"A reliable starter.",metrics:[{label:"Rank",value:"1st"}]}],
      build:[],shop:[],
    },
    ...overrides,
  };
}

test("Team Insights uses the selected team and keeps the approved desktop section order",()=>{
  const alternate=team({rosterId:2,team:"Alternate Team"});
  const html=teamInsightsMarkup({teams:[alternate,team()],totalRosters:2,unsupportedSlots:[]},"Focused Team");
  assert.match(html,/Focused Team Team Insights/);
  const order=["Championship Recommendation","Current Season","Overall Performance","Roster Profile","Team Strengths","Position, Bench & Draft Reviews","Build Around","Optimal Lineup Evidence","Full Roster"];
  const positions=order.map(text=>html.indexOf(text));
  assert.ok(positions.every(position=>position>=0));
  assert.ok(positions.every((position,index)=>index===0||position>positions[index-1]));
  assert.match(html,/Expected PPG/);
  assert.match(html,/Starter Slot/);
  assert.match(html,/Position Rank/);
});

test("Team Insights safely handles missing reports, missing teams, and candidate fallbacks",()=>{
  assert.match(teamInsightsMarkup(null,""),/No analysis is loaded/);
  assert.match(teamInsightsMarkup({teams:[]},""),/does not contain any teams/);
  const html=teamInsightsMarkup({teams:[team()],totalRosters:1,unsupportedSlots:["LB"]},"missing");
  assert.match(html,/Format warning/);
  assert.match(html,/No young, playable, high-value cornerstone/);
  assert.match(html,/No aging, marketable contributor/);
  assert.match(html,/Rank/);
});
