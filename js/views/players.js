// Player master view. It filters normalized player records already calculated
// by the analysis workflow; it never fetches or alters source data.
import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { tierClass } from "../league.js";
import { sortableTable } from "./shared.js";

export function renderPlayers(){
  const a=state.analysis,teams=[...new Set(a.players.map(p=>p.fantasyTeam))].sort(),positions=[...new Set(a.players.map(p=>p.position))].sort();
  $("#players").innerHTML=`<div class="panel">
    <div class="section-title">
      <div><h2>Player Master</h2><span class="small">${a.players.length} rostered players; defaulted to ${esc(state.selectedTeam)}</span></div>
      
    </div>
    <div class="player-filters">
      <input id="playerSearch" placeholder="Search player">
      <select id="playerTeam"><option value="">All teams</option>${teams.map(x=>`<option value="${esc(x)}" ${x===state.selectedTeam?"selected":""}>${esc(x)}</option>`).join("")}</select>
      <select id="playerPos"><option value="">All positions</option>${positions.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <select id="playerRisk"><option value="">All risk tiers</option><option>Low</option><option>Moderate</option><option>High</option><option>Very High</option></select>
      <select id="playerStatus"><option value="">All roster statuses</option><option>Starter</option><option>Bench</option><option>Reserve</option><option>Taxi</option></select>
    </div><div id="playerTable"></div>
  </div>`;
  
  ["playerSearch","playerTeam","playerPos","playerRisk","playerStatus"].forEach(id=>$("#"+id).addEventListener(id==="playerSearch"?"input":"change",renderPlayerTable));
  renderPlayerTable();
}

export function renderPlayerTable(){
  // q is the search phrase; team, pos, risk, and status are selected filters.
  // h describes the output columns passed to the shared sortable-table builder.
  const q=($("#playerSearch")?.value||"").toLowerCase(),team=$("#playerTeam")?.value||"",pos=$("#playerPos")?.value||"",risk=$("#playerRisk")?.value||"",status=$("#playerStatus")?.value||"";
  const rows=state.analysis.players.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!team||p.fantasyTeam===team)&&(!pos||p.position===pos)&&(!risk||p.riskTier===risk)&&(!status||p.rosterStatus===status));
  const h=[
    {key:"fantasyTeam",label:"Fantasy Team"},{key:"name",label:"Player"},{key:"position",label:"Pos"},{key:"positionRank",label:"Pos Rank",num:true,render:r=>`${r.position}${r.positionRank||"—"}`},
    {key:"positionTier",label:"Tier",render:r=>`<span class="tier-chip ${tierClass(r.positionTier)}">${esc(r.positionTier||"Unrated")}</span>`},
    {key:"nflTeam",label:"NFL"},{key:"age",label:"Age",num:true,render:r=>fmt(r.age,0)},{key:"rosterStatus",label:"Roster Status"},
    {key:"actualPoints",label:"Season Points",num:true,render:r=>fmt(r.actualPoints,1)},{key:"actualPpg",label:"Actual PPG",num:true,render:r=>fmt(r.actualPpg,2)},
    {key:"expectedPpg",label:"Expected PPG",num:true,render:r=>fmt(r.expectedPpg,2)},{key:"projectedTotal",label:"Projected Total",num:true,render:r=>fmt(r.projectedTotal,1)},
    {key:"dynastyValue",label:"Consensus Value",num:true,render:r=>intFmt(r.dynastyValue)},{key:"riskTier",label:"Risk"},{key:"injuryStatus",label:"Injury"},{key:"projectionSource",label:"Projection Source"}
  ];
  $("#playerTable").innerHTML=sortableTable(h,rows,"players");
}
