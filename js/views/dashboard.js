import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { classCss } from "../league.js";
import { evidenceHtml, sortableTable } from "./shared.js";

export function renderDashboard(){
  const a=state.analysis;if(!a)return;
  if(!a.teams.some(t=>t.team===state.selectedTeam))state.selectedTeam=a.teams[0]?.team||"";
  const focus=a.teams.find(t=>t.team===state.selectedTeam)||a.teams[0],leader=a.teams[0];
  const headers=[
    {key:"currentRank",label:"Rank",num:true},{key:"team",label:"Team"},{key:"currentClass",label:"Class",render:r=>`<span class="${classCss(r.currentClass)}">${esc(r.currentClass)}</span>`},
    {key:"lineupPpg",label:"Expected PPG",num:true,render:r=>fmt(r.lineupPpg,2)},{key:"depth",label:"Depth",num:true,render:r=>fmt(r.depth,2)},
    {key:"production",label:a.useCurrentProduction?"Current PF":"Prior PF",num:true,render:r=>fmt(a.useCurrentProduction?r.currentPF:r.priorPF,1)},
    {key:"totalValue",label:"Dynasty Value",num:true,render:r=>intFmt(r.totalValue)},{key:"risk",label:"Risk",num:true,render:r=>fmt(r.risk,1)},
    {key:"futureFirsts",label:"Future 1sts",num:true},{key:"contenderScore",label:"Score",num:true,render:r=>fmt(r.contenderScore,1)},{key:"franchiseRank",label:"Dynasty Rank",num:true}
  ];
  $("#dashboard").innerHTML=`
    <div class="panel team-control-panel">
      <div class="section-title">
        <div><h2>Dashboard Overview</h2><div class="small">Use the static team selector in the top banner to update all team-specific tabs at once.</div></div>
        
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="label">League</div><div class="value" style="font-size:1.1rem">${esc(a.leagueName)}</div></div>
      <div class="kpi"><div class="label">Format</div><div class="value">${esc(a.formatLabel)}</div></div>
      <div class="kpi"><div class="label">Season / Week</div><div class="value">${a.season} / ${a.currentWeek||"Pre"}</div></div>
      <div class="kpi"><div class="label">${esc(focus.team)} Rank</div><div class="value">#${focus.currentRank}</div></div>
      <div class="kpi"><div class="label">Expected PPG</div><div class="value">${fmt(focus.lineupPpg,2)}</div></div>
      <div class="kpi"><div class="label">Gap to No. 1</div><div class="value">${fmt(leader.lineupPpg-focus.lineupPpg,2)}</div></div>
    </div>
    ${a.unsupportedSlots.length?`<div class="callout warn"><strong>Format warning:</strong> The league contains ${esc(a.unsupportedSlots.join(", "))}. Sleeper roster analysis is included, but public dynasty market values for IDP players may be incomplete.</div>`:""}
    <div class="grid-2" style="margin-top:18px">
      <div class="panel"><div class="section-title"><h2>League Power Rankings</h2></div>${sortableTable(headers,a.teams,"rankings")}</div>
      <div class="panel"><div class="section-title"><h2>Projected Lineup PPG</h2></div><canvas id="rankChart" class="chart"></canvas></div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>${esc(focus.team)} Recommendation</h2><span class="${classCss(focus.currentClass)}">${esc(focus.currentClass)}</span></div>
      <div class="callout good"><strong>${esc(focus.insights.strategy)}</strong><div class="small" style="margin-top:6px">${esc(focus.insights.strategyEvidence)}</div></div>
      <div class="grid-2">
        <div><h3>Strengths with Evidence</h3>${evidenceHtml(focus.insights.strengths,"strength")}</div>
        <div><h3>Weaknesses with Evidence</h3>${evidenceHtml(focus.insights.weaknesses,"weakness")}</div>
      </div>
    </div>`;
  
  requestAnimationFrame(drawRankChart);
}

export function drawRankChart(){
  const canvas=$("#rankChart");if(!canvas||!state.analysis)return;const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;const c=canvas.getContext("2d");c.scale(dpr,dpr);
  const teams=state.analysis.teams,max=Math.max(...teams.map(t=>t.lineupPpg)),min=Math.min(...teams.map(t=>t.lineupPpg))*0.9;
  c.font="12px system-ui";c.textBaseline="middle";const left=150,right=35,top=14,rowH=(rect.height-28)/teams.length;
  teams.forEach((t,i)=>{const y=top+i*rowH;c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--muted");c.fillText(t.team.slice(0,21),8,y+rowH/2);
    const w=(t.lineupPpg-min)/(max-min)*(rect.width-left-right);c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--blue");c.fillRect(left,y+rowH*.2,w,rowH*.6);
    c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--text");c.fillText(t.lineupPpg.toFixed(1),left+w+6,y+rowH/2)});
}
