// Trade explorer view: compares assets from the completed analysis and presents
// possible deal value; it never submits or changes a real Sleeper transaction.
import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { eligible, tierClass } from "../league.js";
import { sortableTable } from "./shared.js";

export function weakestSlot(team){
  const skill=team.lineup.filter(x=>["RB","WR","TE","FLEX","SUPER_FLEX"].some(k=>x.slot.includes(k)||x.player.position===k));
  return skill.sort((a,b)=>a.player.expectedPpg-b.player.expectedPpg)[0]||team.lineup.sort((a,b)=>a.player.expectedPpg-b.player.expectedPpg)[0];
}

export function tradeCandidates(team){
  const weak=weakestSlot(team);if(!weak)return [];
  return state.analysis.players.filter(p=>p.rosterId!==team.rosterId&&p.rosterStatus!=="Taxi"&&eligible(weak.slot,p.position)&&p.expectedPpg>weak.player.expectedPpg+.35)
    .map(p=>({...p,gain:p.expectedPpg-weak.player.expectedPpg,efficiency:(p.expectedPpg-weak.player.expectedPpg)/(p.dynastyValue/1000+.35)}))
    .sort((a,b)=>b.efficiency-a.efficiency).slice(0,30);
}

export function renderTrade(){
  const a=state.analysis;if(!a)return;
  $("#trade").innerHTML=`<div class="panel">
    <div class="section-title">
      <div><h2>League Trade Center</h2><div class="small">Use the header Focus Team selector to refresh the focus roster throughout the application.</div></div>
      
    </div>
    <div id="tradeBody"></div>
  </div>`;
  
  renderTradeBody();
}

export function renderTradeBody(){
  const team=state.analysis.teams.find(t=>t.team===state.selectedTeam)||state.analysis.teams[0],weak=weakestSlot(team),rows=tradeCandidates(team);
  const h=[
    {key:"name",label:"Player"},{key:"fantasyTeam",label:"Current Team"},{key:"position",label:"Pos"},
    {key:"positionRank",label:"Pos Rank",num:true,render:r=>`${r.position}${r.positionRank||"—"}`},
    {key:"positionTier",label:"Tier",render:r=>`<span class="tier-chip ${tierClass(r.positionTier)}">${esc(r.positionTier||"Unrated")}</span>`},
    {key:"age",label:"Age",num:true,render:r=>fmt(r.age,0)},{key:"expectedPpg",label:"Expected PPG",num:true,render:r=>fmt(r.expectedPpg,2)},
    {key:"gain",label:"Gain",num:true,render:r=>`+${fmt(r.gain,2)}`},{key:"dynastyValue",label:"Value",num:true,render:r=>intFmt(r.dynastyValue)},
    {key:"riskTier",label:"Risk"},{key:"projectionSource",label:"Projection Source"}
  ];
  $("#tradeBody").innerHTML=`<div class="callout"><strong>${esc(team.team)} weakest projected slot:</strong> ${esc(weak?.slot||"—")} — ${esc(weak?.player.name||"—")} at ${fmt(weak?.player.expectedPpg,2)} expected PPG (${esc(weak?.player.positionTier||"Unrated")}, ${weak?.player.position||""}${weak?.player.positionRank||"—"}). Targets are ranked by projected gain relative to market cost.</div>${sortableTable(h,rows,"tradeTargets")}`;
}
