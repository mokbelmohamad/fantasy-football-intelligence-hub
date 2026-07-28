import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { classCss, ordinal } from "../league.js";
import { sortableTable } from "./shared.js";

const signed=value=>`${value>=0?"+":""}${fmt(value,2)}`;
const rankText=(rank,total)=>rank?`${ordinal(rank)} of ${total}`:"N/A";

function teamInsightReviewHtml(items,type){
  const heading=type==="strength"?"Team Strengths":"Areas to Improve";
  const intro=type==="strength"
    ?"The roster advantages most likely to support a championship run, based on projected production, depth, dynasty value, and risk."
    :"The roster limitations most likely to reduce championship odds, create lineup volatility, or require a targeted move.";
  return `<section class="team-insight-review ${type}">
    <div class="team-insight-review-heading"><h3>${heading}</h3><p>${intro}</p></div>
    <div class="team-insight-review-grid">${items.map((item,index)=>`<article class="team-insight-card ${type}">
      <div class="team-insight-number">${index+1}</div>
      <div class="team-insight-content">
        <h4>${esc(item.title)}</h4>
        <p>${esc(item.summary||item.detail||"")}</p>
        ${(item.metrics||[]).length?`<div class="team-insight-data" aria-label="${esc(item.title)} supporting data">${item.metrics.map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong></div>`).join("")}</div>`:""}
      </div>
    </article>`).join("")}</div>
  </section>`;
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
          <div><span>Gap to #1</span><strong>${team.currentRank===1?"Leader":`-${fmt(teams[0].lineupPpg-team.lineupPpg,2)}`}</strong></div>
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
  if(!a.teams.some(t=>t.team===state.selectedTeam))state.selectedTeam=a.teams[0]?.team||"";
  const focus=a.teams.find(t=>t.team===state.selectedTeam)||a.teams[0],leader=a.teams[0];
  const leagueAverage=a.teams.length?a.teams.reduce((sum,t)=>sum+t.lineupPpg,0)/a.teams.length:0;
  const historical=focus.historical||{};
  const seasonStatus=a.leagueStatus==="complete"?"Final":a.currentWeek?`Through Week ${a.currentWeek}`:"Preseason";
  const currentRecord=historical.currentRecord||`${focus.currentWins||0}-${focus.currentLosses||0}`;
  const standing=historical.currentStanding?`#${historical.currentStanding} of ${a.totalRosters}`:"Not available";
  const overallGames=historical.games||0;
  const winPct=overallGames?((historical.wins+(historical.ties||0)*.5)/overallGames)*100:0;
  const historicalGap=(historical.averagePpg||0)-(historical.historicalLeagueAverage||0);
  const headers=[
    {key:"currentRank",label:"Rank",num:true},
    {key:"team",label:"Team",render:r=>`<strong>${esc(r.team)}</strong>${r.manager?`<div class="table-subtext">${esc(r.manager)}</div>`:""}`},
    {key:"currentClass",label:"Class",render:r=>`<span class="${classCss(r.currentClass)}">${esc(r.currentClass)}</span>`},
    {key:"lineupPpg",label:"EPPG",num:true,render:r=>fmt(r.lineupPpg,2)},
    {key:"gapToLeader",label:"Gap to #1",num:true,render:r=>r.currentRank===1?"Leader":`-${fmt(leader.lineupPpg-r.lineupPpg,2)}`},
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
  const outlook=focus.insights?.championshipOutlook||{};
  $("#dashboard").innerHTML=`
    <div class="panel team-control-panel">
      <div class="section-title"><div><h2>Dashboard Overview</h2><div class="small">Team-specific metrics update with the focus-team selector in the top banner.</div></div></div>
    </div>
    <section class="dashboard-summary-section" aria-labelledby="currentSeasonTitle">
      <div class="dashboard-summary-heading"><div><h2 id="currentSeasonTitle">Current Season</h2><div class="small">Forward-looking model metrics and actual Sleeper standing for ${esc(String(a.season))}.</div></div><span class="season-status">${esc(seasonStatus)}</span></div>
      <div class="dashboard-kpi-grid current-season-grid">
        <div class="kpi"><div class="label">Contender Rank</div><div class="value">#${focus.currentRank} of ${a.totalRosters}</div><div class="kpi-note">Model-based championship rank</div></div>
        <div class="kpi"><div class="label">Expected PPG</div><div class="value">${fmt(focus.lineupPpg,2)}</div><div class="kpi-note">Optimal legal lineup</div></div>
        <div class="kpi"><div class="label">Gap to #1</div><div class="value">${focus.currentRank===1?"Leader":`-${fmt(leader.lineupPpg-focus.lineupPpg,2)}`}</div><div class="kpi-note">Expected PPG difference</div></div>
        <div class="kpi"><div class="label">Gap to League Average</div><div class="value">${signed(focus.lineupPpg-leagueAverage)}</div><div class="kpi-note">Expected PPG difference</div></div>
        <div class="kpi"><div class="label">Current Standing & Record</div><div class="value compact-value">${esc(standing)}</div><div class="kpi-note">${esc(currentRecord)} · ${esc(seasonStatus)}</div></div>
      </div>
      ${!a.currentWeek&&a.leagueStatus!=="complete"?`<div class="summary-note"><strong>Preseason:</strong> current standings are not yet meaningful; contender rankings are model-based.</div>`:""}
    </section>
    <section class="dashboard-summary-section" aria-labelledby="overallPerformanceTitle">
      <div class="dashboard-summary-heading"><div><h2 id="overallPerformanceTitle">Overall Performance</h2><div class="small">Matched franchise history across ${historical.seasonsMatched||0} linked seasons and ${historical.games||0} completed matchups.</div></div></div>
      <div class="dashboard-kpi-grid overall-performance-grid">
        <div class="kpi"><div class="label">Average Finish</div><div class="value">${historical.averageFinish==null?"N/A":fmt(historical.averageFinish,1)}</div><div class="kpi-note">${historical.completedSeasons||0} completed seasons</div></div>
        <div class="kpi featured-kpi"><div class="label">Historical Average PPG</div><div class="value">${fmt(historical.averagePpg||0,2)}</div><div class="kpi-note">#${historical.historicalPpgRank||"-"} of ${a.totalRosters} · ${signed(historicalGap)} vs league average</div></div>
        <div class="kpi"><div class="label">Overall Record</div><div class="value compact-value">${historical.wins||0}-${historical.losses||0}${historical.ties?`-${historical.ties}`:""}</div><div class="kpi-note">Across matched linked seasons</div></div>
        <div class="kpi"><div class="label">Overall Win Percentage</div><div class="value">${fmt(winPct,1)}%</div><div class="kpi-note">Ties count as half a win</div></div>
      </div>
    </section>
    ${a.unsupportedSlots.length?`<div class="callout warn"><strong>Format warning:</strong> The league contains ${esc(a.unsupportedSlots.join(", "))}. Sleeper roster analysis is included, but public dynasty market values for IDP players may be incomplete.</div>`:""}
    <section class="panel power-rankings-panel">
      <div class="section-title"><div><h2>League Power Rankings</h2><div class="small">Full-league comparison retaining production, dynasty, risk, pick, and Contender Index metrics while adding positional ranks and roster strengths and weaknesses.</div></div></div>
      <div class="power-ranking-table">${sortableTable(headers,a.teams,"rankings")}</div>
      ${mobilePowerCards(a.teams,a.totalRosters,a.useCurrentProduction)}
    </section>
    <section class="panel championship-review-panel">
      <div class="section-title"><div><h2>Championship Outlook & Roster Review</h2><div class="small">A championship-focused recommendation followed by analytical reviews of the roster's strongest advantages and most important limitations.</div></div><span class="${classCss(focus.currentClass)}">${esc(focus.currentClass)}</span></div>
      <div class="championship-outlook">
        <div class="outlook-label">Recommendation</div>
        <h3>${esc(outlook.title||focus.insights?.strategy||"Review the roster before making a move")}</h3>
        <div class="outlook-explanation">
          ${(outlook.explanation||focus.insights?.strategyEvidence||"").split("\n\n").filter(Boolean).map(paragraph=>`<p>${esc(paragraph)}</p>`).join("")}
        </div>
        <div class="outlook-metrics">
          ${(outlook.metrics||[]).map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong></div>`).join("")}
        </div>
      </div>
      <div class="team-insight-review-wrap">
        ${teamInsightReviewHtml(focus.insights?.strengths||[],"strength")}
        ${teamInsightReviewHtml(focus.insights?.weaknesses||[],"weakness")}
      </div>
    </section>`;
}

export function drawRankChart(){}
