// Dashboard view: summarizes one completed analysis; it does not recalculate it.
import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { classCss, ordinal } from "../league.js";
import { gapToLeaderLabel, sortableTable } from "./shared.js?v=2.3.0";

const LAST_LEAGUE_WEEK=17;
const rankText=(rank,total)=>rank?`${ordinal(rank)} of ${total}`:"N/A";
const historyColors={focus:"#1677ff",league:"#526578"};

function focusedTeam(analysis){
  return analysis?.teams?.find(team=>team.team===state.selectedTeam)||analysis?.teams?.[0]||null;
}

// Converts every fetched, completed matchup into a single shared time axis.
// Weekly points are never synthesized: a point exists only when Sleeper
// supplied a numeric matchup score for that roster and week.
export function leagueHistorySeries(analysis, mode="weekly"){
  const focus=focusedTeam(analysis);
  const series=(analysis?.teams||[]).map(team=>{
    const seasons=(team.weeklyHistory||[]).filter(season=>mode==="weekly"||season.complete===true);
    const points=mode==="weekly"
      ?seasons.flatMap(season=>(season.weekly||[])
        .filter(point=>Number(point.week)>=1&&Number(point.week)<=LAST_LEAGUE_WEEK)
        .map(point=>({season:season.season,week:point.week,value:point.points??point.ppg})))
      :seasons.map(season=>({season:season.season,value:season.wins}));
    return {rosterId:team.rosterId,team:team.team,focused:team.rosterId===focus?.rosterId,points};
  }).filter(item=>item.points.length);
  const slots=mode==="weekly"
    ?[...new Map(series.flatMap(item=>item.points.map(point=>[`${point.season}:${point.week}`,{season:point.season,week:point.week}]))).values()].sort((a,b)=>a.season-b.season||a.week-b.week)
    :[...new Set(series.flatMap(item=>item.points.map(point=>point.season)))].sort((a,b)=>a-b).map(season=>({season}));
  return {series,slots};
}

function resizeHistoryCanvas(canvas, slotCount){
  const minWidth=slotCount*38+78;
  const width=Math.max(560,Math.ceil(canvas.parentElement?.clientWidth||560),minWidth);
  const height=360,dpr=window.devicePixelRatio||1;
  canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  const context=canvas.getContext("2d");context.scale(dpr,dpr);return {context,width,height};
}

function drawHistoryGrid(context,width,height,maxValue,slots,mode){
  const pad={top:40,right:24,bottom:54,left:54};
  context.strokeStyle="#d8e1eb";context.fillStyle="#526578";context.lineWidth=1;context.font="11px system-ui";
  for(let index=0;index<=4;index+=1){const value=maxValue*index/4;const y=height-pad.bottom-(height-pad.top-pad.bottom)*index/4;context.beginPath();context.moveTo(pad.left,y);context.lineTo(width-pad.right,y);context.stroke();context.fillText(fmt(value,0),8,y+4);}
  const usable=width-pad.left-pad.right,slotWidth=usable/Math.max(1,slots.length-1);
  slots.forEach((slot,index)=>{const x=pad.left+index*slotWidth;const prior=slots[index-1];const newSeason=!prior||prior.season!==slot.season;context.strokeStyle=newSeason?"#aebccc":"#e6edf4";context.beginPath();context.moveTo(x,pad.top);context.lineTo(x,height-pad.bottom);context.stroke();context.fillStyle="#526578";if(newSeason)context.fillText(String(slot.season),x+3,18);if(mode==="weekly")context.fillText(`W${slot.week}`,x-8,height-24);else context.fillText(String(slot.season),x-12,height-24);});
  context.fillText(mode==="weekly"?"Every completed league week":"Completed season",width/2-50,height-8);return {pad,slotWidth};
}

function drawHistoryLines(context,width,height,history,mode){
  const {series,slots}=history;if(!series.length||!slots.length)return;
  const maxValue=Math.max(1,...series.flatMap(item=>item.points.map(point=>point.value)));
  const {pad,slotWidth}=drawHistoryGrid(context,width,height,maxValue,slots,mode);
  const lookup=new Map(slots.map((slot,index)=>[mode==="weekly"?`${slot.season}:${slot.week}`:String(slot.season),index]));
  const xFor=point=>pad.left+(lookup.get(mode==="weekly"?`${point.season}:${point.week}`:String(point.season))||0)*slotWidth;
  const yFor=point=>height-pad.bottom-point.value/maxValue*(height-pad.top-pad.bottom);
  for(const item of series.filter(item=>!item.focused)){context.globalAlpha=.16;context.strokeStyle=historyColors.league;context.lineWidth=1.25;context.beginPath();item.points.forEach((point,index)=>{if(index)context.lineTo(xFor(point),yFor(point));else context.moveTo(xFor(point),yFor(point));});context.stroke();}
  const focus=series.find(item=>item.focused);if(focus){context.globalAlpha=1;context.strokeStyle=historyColors.focus;context.lineWidth=4;context.beginPath();focus.points.forEach((point,index)=>{if(index)context.lineTo(xFor(point),yFor(point));else context.moveTo(xFor(point),yFor(point));});context.stroke();}
  context.globalAlpha=1;
}

export function drawLeagueHistoryChart(){
  const canvas=$("#leagueHistoryChart"),empty=$("#leagueHistoryChartEmpty");
  if(!canvas)return;
  const mode=$("#leagueHistoryMode")?.value||"weekly",history=leagueHistorySeries(state.analysis,mode);
  const focus=history.series.find(item=>item.focused),hasData=Boolean(focus?.points.length);
  canvas.classList.toggle("hidden",!hasData);if(empty)empty.classList.toggle("hidden",hasData);if(!hasData)return;
  const {context,width,height}=resizeHistoryCanvas(canvas,history.slots.length);context.clearRect(0,0,width,height);drawHistoryLines(context,width,height,history,mode);
}

function mobilePowerCards(teams,total,useCurrentProduction){
  return `<div class="power-ranking-cards">${teams.map(team=>`
    <details class="power-ranking-card" ${team.currentRank===1?"open":""}>
      <summary>
        <div class="power-card-rank">#${team.currentRank}</div>
        <div class="power-card-team"><strong>${esc(team.team)}</strong><span>${esc(team.manager||"")}</span></div>
        <div class="power-card-score"><strong>${fmt(team.contenderScore,1)}</strong><span>Contender Index</span><span class="${classCss(team.currentClass)}">${esc(team.currentClass)}</span></div>
      </summary>
      <div class="power-card-body">
        <div class="power-card-primary">
          <div><span>EPPG</span><strong>${fmt(team.lineupPpg,2)}</strong></div>
          <div><span>Gap to #1</span><strong>${team.currentRank===1?"Leader":gapToLeaderLabel(teams[0].lineupPpg,team.lineupPpg)}</strong></div>
          <div><span>${useCurrentProduction?"Current PF":"Prior PF"}</span><strong>${fmt(useCurrentProduction?team.currentPF:team.priorPF,1)}</strong></div>
          <div><span>Dynasty Value</span><strong>${intFmt(team.totalValue)}</strong></div>
          <div><span>Dynasty Rank</span><strong>${rankText(team.franchiseRank,total)}</strong></div>
          <div><span>Contender Index</span><strong>${fmt(team.contenderScore,1)}</strong></div>
          <div><span>Depth</span><strong>${fmt(team.depth,2)}</strong></div>
          <div><span>Risk</span><strong>${fmt(team.risk,1)}</strong></div>
          <div><span>Future 1sts</span><strong>${team.futureFirsts??0}</strong></div>
        </div>
        <div class="power-card-positions">
          ${["QB","RB","WR","TE","FLEX"].map(pos=>`<span>${pos} <strong>${rankText(team.positionRanks?.[pos],total)}</strong></span>`).join("")}
        </div>
        <div class="power-card-strengths"><span><strong>Strength:</strong> ${esc(team.biggestStrength||"Balanced")}</span><span><strong>Weakness:</strong> ${esc(team.biggestWeakness||"None")}</span></div>
      </div>
    </details>`).join("")}</div>`;
}

export function renderDashboard(){
  const a=state.analysis;if(!a)return;
  const leader=a.teams[0];
  const headers=[
    {key:"currentRank",label:"Rank",num:true},
    {key:"team",label:"Team",render:r=>`<strong>${esc(r.team)}</strong>${r.manager?`<div class="table-subtext">${esc(r.manager)}</div>`:""}`},
    {key:"currentClass",label:"Class",render:r=>`<span class="${classCss(r.currentClass)}">${esc(r.currentClass)}</span>`},
    {key:"lineupPpg",label:"EPPG",num:true,render:r=>fmt(r.lineupPpg,2)},
    {key:"gapToLeader",label:"Gap to #1",num:true,render:r=>r.currentRank===1?"Leader":gapToLeaderLabel(leader.lineupPpg,r.lineupPpg)},
    {key:"depth",label:"Depth",num:true,render:r=>fmt(r.depth,2)},
    {key:"production",label:a.useCurrentProduction?"Current PF":"Prior PF",num:true,render:r=>fmt(a.useCurrentProduction?r.currentPF:r.priorPF,1)},
    {key:"totalValue",label:"Dynasty Value",num:true,render:r=>intFmt(r.totalValue)},
    {key:"risk",label:"Risk",num:true,render:r=>fmt(r.risk,1)},
    {key:"futureFirsts",label:"Future 1sts",num:true},
    {key:"contenderScore",label:"Contender Index",num:true,render:r=>fmt(r.contenderScore,1)},
    {key:"franchiseRank",label:"Dynasty Rank",num:true},
    ...["QB","RB","WR","TE","FLEX"].map(pos=>({key:`${pos.toLowerCase()}Rank`,label:pos,num:true,render:r=>r.positionRanks?.[pos]?ordinal(r.positionRanks[pos]):"-"})),
    {key:"biggestStrength",label:"Strength"},
    {key:"biggestWeakness",label:"Weakness"},
  ];
  $("#dashboard").innerHTML=`
    ${a.unsupportedSlots.length?`<div class="callout warn"><strong>Format warning:</strong> The league contains ${esc(a.unsupportedSlots.join(", "))}. Sleeper roster analysis is included, but public dynasty market values for IDP players may be incomplete.</div>`:""}
    <section class="panel league-history-panel">
      <div class="section-title"><div><h2>League Scoring History</h2><div class="small">Every point is a completed Sleeper matchup week. The focused team is bold; every other league roster is shown faintly for context.</div></div><label class="league-history-control">Chart view<select id="leagueHistoryMode" aria-label="League history chart view"><option value="weekly">Weekly points</option><option value="record">Completed-season wins</option></select></label></div>
      <div class="league-history-chart-wrap"><div class="league-history-legend"><span><i class="focus"></i>${esc(focusedTeam(a)?.team||"Focused team")}</span><span><i></i>Other league teams</span></div><canvas id="leagueHistoryChart" role="img" aria-label="League scoring history chart"></canvas><p id="leagueHistoryChartEmpty" class="small hidden">No completed weekly scoring data is available for this report. Reanalyze the league after games have posted.</p></div>
    </section>
    <section class="panel power-rankings-panel">
      <div class="section-title"><div><h2>League Dashboard</h2><div class="small">League Power Rankings compare every roster across production, dynasty, risk, draft capital, and positional strength. Select a Focus Team to see its detailed season and historical review on Team Insights.</div></div></div>
      <div class="power-ranking-table">${sortableTable(headers,a.teams,"rankings")}</div>
      ${mobilePowerCards(a.teams,a.totalRosters,a.useCurrentProduction)}
    </section>`;
  const control=$("#leagueHistoryMode");if(control)control.addEventListener("change",drawLeagueHistoryChart);
  if(typeof requestAnimationFrame==="function")requestAnimationFrame(drawLeagueHistoryChart);else drawLeagueHistoryChart();
}

export function drawRankChart(){}
