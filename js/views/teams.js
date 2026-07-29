// Team-list and focused-team views. state.analysis contains all teams, while
// state.selectedTeam identifies the roster currently being examined.
import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { tierClass } from "../league.js";
import { evidenceHtml, sortableTable } from "./shared.js";

export function renderTeams(){
  const a=state.analysis;if(!a)return;
  const t=a.teams.find(x=>x.team===state.selectedTeam)||a.teams[0];
  $("#teams").innerHTML=`<div class="panel">
    <div class="section-title">
      <div><h2>Team-by-Team Insights</h2><div class="small">Use the header Focus Team selector to change the focus team across all tabs.</div></div>
      
    </div>
    <div id="teamInsightBody"></div>
  </div>
  <div class="grid-3">${a.teams.map(team=>`<div class="team-card ${team.team===state.selectedTeam?"focused":""}"><h3>#${team.currentRank} ${esc(team.team)}</h3><div class="meta">${esc(team.currentClass)} · Dynasty #${team.franchiseRank}</div><p><strong>${fmt(team.lineupPpg,1)} PPG</strong> · ${intFmt(team.totalValue)} value · ${team.futureFirsts} future 1sts</p><div class="small">${esc(team.insights.strategy)}</div></div>`).join("")}</div>`;
  
  renderTeamDetail();
}

export function renderTeamDetail(){
  const t=state.analysis.teams.find(x=>x.team===state.selectedTeam)||state.analysis.teams[0];
  const lineupHeaders=[
    {key:"slot",label:"Slot"},{key:"name",label:"Player"},{key:"position",label:"Pos"},
    {key:"positionRank",label:"Pos Rank",num:true,render:r=>`${r.position}${r.positionRank||"—"}`},
    {key:"positionTier",label:"Tier",render:r=>`<span class="tier-chip ${tierClass(r.positionTier)}">${esc(r.positionTier||"Unrated")}</span>`},
    {key:"expectedPpg",label:"Expected PPG",num:true,render:r=>fmt(r.expectedPpg,2)},
    {key:"projectedTotal",label:"Projected Total",num:true,render:r=>fmt(r.projectedTotal,1)},
    {key:"dynastyValue",label:"Value",num:true,render:r=>intFmt(r.dynastyValue)},{key:"riskTier",label:"Risk"}
  ];
  const rows=t.lineup.map(x=>({slot:x.slot,...x.player}));
  $("#teamInsightBody").innerHTML=`<div class="kpis">
    <div class="kpi"><div class="label">Current Rank</div><div class="value">#${t.currentRank}</div></div>
    <div class="kpi"><div class="label">Expected PPG</div><div class="value">${fmt(t.lineupPpg,2)}</div></div>
    <div class="kpi"><div class="label">Depth Index</div><div class="value">${fmt(t.depth,2)}</div></div>
    <div class="kpi"><div class="label">Dynasty Value</div><div class="value">${intFmt(t.totalValue)}</div></div>
    <div class="kpi"><div class="label">Lineup Risk</div><div class="value">${fmt(t.risk,1)}</div></div>
    <div class="kpi"><div class="label">Future 1sts</div><div class="value">${t.futureFirsts}</div></div>
  </div>
  <div class="callout good"><strong>${esc(t.insights.strategy)}</strong><div class="small" style="margin-top:6px">${esc(t.insights.strategyEvidence)}</div></div>
  <div class="grid-2">
    <div><h3>Strengths with Evidence</h3>${evidenceHtml(t.insights.strengths,"strength")}</div>
    <div><h3>Weaknesses with Evidence</h3>${evidenceHtml(t.insights.weaknesses,"weakness")}</div>
  </div>
  <div class="grid-2">
    <div><h3>Build Around</h3><p>${t.insights.build.length?t.insights.build.map(p=>`${esc(p.name)} — ${p.position}${p.positionRank||"?"}, ${esc(p.positionTier||"Unrated")}, age ${p.age??"—"}, ${fmt(p.expectedPpg,2)} PPG, ${intFmt(p.dynastyValue)} value`).join("<br>"):"No clear young cornerstone identified."}</p></div>
    <div><h3>Shop / Reassess</h3><p>${t.insights.shop.length?t.insights.shop.map(p=>`${esc(p.name)} — age ${p.age??"—"}, ${fmt(p.expectedPpg,2)} PPG, ${intFmt(p.dynastyValue)} value, ${esc(p.riskTier)}`).join("<br>"):"No obvious age-based sell candidate."}</p></div>
  </div>
  <h3>Optimal Lineup and Player Tiers</h3>${sortableTable(lineupHeaders,rows,"teamlineup")}`;
}
