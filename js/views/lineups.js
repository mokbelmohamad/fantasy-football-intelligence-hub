import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { classCss, tierClass } from "../league.js";
import { sortableTable } from "./shared.js";

export function renderLineups(){
  const a=state.analysis,focus=a.teams.find(t=>t.team===state.selectedTeam)||a.teams[0];
  const h=[
    {key:"rank",label:"Team Rank",num:true},{key:"team",label:"Team"},{key:"slot",label:"Slot"},
    {key:"name",label:"Player"},{key:"position",label:"Pos"},
    {key:"positionRank",label:"Pos Rank",num:true,render:r=>`${r.position}${r.positionRank||"—"}`},
    {key:"positionTier",label:"Tier",render:r=>`<span class="tier-chip ${tierClass(r.positionTier)}">${esc(r.positionTier||"Unrated")}</span>`},
    {key:"expectedPpg",label:"Expected PPG",num:true,render:r=>fmt(r.expectedPpg,2)},
    {key:"projectedTotal",label:"Projected Total",num:true,render:r=>fmt(r.projectedTotal,1)},
    {key:"dynastyValue",label:"Value",num:true,render:r=>intFmt(r.dynastyValue)},{key:"riskTier",label:"Risk"}
  ];
  const focusRows=focus.lineup.map(x=>({team:focus.team,rank:focus.currentRank,slot:x.slot,...x.player}));
  const allRows=a.teams.flatMap(t=>t.lineup.map(x=>({team:t.team,rank:t.currentRank,slot:x.slot,...x.player})));
  $("#lineups").innerHTML=`
    <div class="panel team-control-panel">
      <div class="section-title">
        <div><h2>Optimal Lineups</h2><div class="small">Use the header Focus Team selector to update the focus team across all tabs.</div></div>
        
      </div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>${esc(focus.team)} Optimal Legal Lineup</h2><span class="${classCss(focus.currentClass)}">#${focus.currentRank} ${esc(focus.currentClass)}</span></div>
      <p class="small">Taxi players are excluded. Expected PPG is projected season total divided by 17.</p>
      ${sortableTable(h,focusRows,"focusedLineup")}
    </div>
    <div class="panel"><div class="section-title"><h2>All League Lineups</h2></div>${sortableTable(h,allRows,"allLineups")}</div>`;
  
}
