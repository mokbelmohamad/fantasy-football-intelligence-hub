// Focused-team desktop report. The global Focus Team control selects the roster;
// this view explains that roster without duplicating a second team picker.
import { state } from "../state.js";
import { $, esc, fmt, intFmt } from "../utils.js";
import { classCss, tierClass } from "../league.js";
import { gapToLeaderLabel, sortableTable, teamInsightReviewHtml } from "./shared.js?v=2.3.0";

const signed=value=>`${value>=0?"+":""}${fmt(value,2)}`;

function focusedTeam(analysis, selectedTeam){
  return analysis?.teams?.find(team=>team.team===selectedTeam)||analysis?.teams?.[0]||null;
}

function seasonAndPerformanceHtml(analysis, team){
  const historical=team.historical||{};
  const leader=analysis.teams?.[0]||team;
  const leagueAverage=analysis.teams?.length?analysis.teams.reduce((sum,item)=>sum+item.lineupPpg,0)/analysis.teams.length:0;
  const seasonStatus=analysis.leagueStatus==="complete"?"Final":analysis.currentWeek?`Through Week ${analysis.currentWeek}`:"Preseason";
  const currentRecord=historical.currentRecord||`${team.currentWins||0}-${team.currentLosses||0}`;
  const standing=historical.currentStanding?`#${historical.currentStanding} of ${analysis.totalRosters}`:"Not available";
  const overallGames=historical.games||0;
  const winPct=overallGames?((historical.wins+(historical.ties||0)*.5)/overallGames)*100:0;
  const historicalGap=(historical.averagePpg||0)-(historical.historicalLeagueAverage||0);
  return `<section class="dashboard-summary-section team-season-section" aria-labelledby="teamCurrentSeasonTitle">
    <div class="dashboard-summary-heading"><div><h3 id="teamCurrentSeasonTitle">Current Season</h3><div class="small">Forward-looking model metrics and actual Sleeper standing for ${esc(String(analysis.season||"the active season"))}.</div></div><span class="season-status">${esc(seasonStatus)}</span></div>
    <div class="dashboard-kpi-grid current-season-grid">
      <div class="kpi"><div class="label">Contender Rank</div><div class="value">#${team.currentRank||"—"} of ${analysis.totalRosters||"—"}</div><div class="kpi-note">Model-based championship rank</div></div>
      <div class="kpi"><div class="label">Expected PPG</div><div class="value">${fmt(team.lineupPpg,2)}</div><div class="kpi-note">Optimal legal lineup</div></div>
      <div class="kpi"><div class="label">Gap to #1</div><div class="value">${team.currentRank===1?"Leader":gapToLeaderLabel(leader.lineupPpg,team.lineupPpg)}</div><div class="kpi-note">Expected PPG difference</div></div>
      <div class="kpi"><div class="label">Gap to League Average</div><div class="value">${signed((team.lineupPpg||0)-leagueAverage)}</div><div class="kpi-note">Expected PPG difference</div></div>
      <div class="kpi"><div class="label">Current Standing & Record</div><div class="value compact-value">${esc(standing)}</div><div class="kpi-note">${esc(currentRecord)} · ${esc(seasonStatus)}</div></div>
    </div>
    ${!analysis.currentWeek&&analysis.leagueStatus!=="complete"?`<div class="summary-note"><strong>Preseason:</strong> current standings are not yet meaningful; contender rankings are model-based.</div>`:""}
  </section>
  <section class="dashboard-summary-section team-performance-section" aria-labelledby="teamOverallPerformanceTitle">
    <div class="dashboard-summary-heading"><div><h3 id="teamOverallPerformanceTitle">Overall Performance</h3><div class="small">Matched franchise history across ${historical.seasonsMatched||0} linked seasons and ${historical.games||0} completed matchups.</div></div></div>
    <div class="dashboard-kpi-grid overall-performance-grid">
      <div class="kpi"><div class="label">Average Finish</div><div class="value">${historical.averageFinish==null?"N/A":fmt(historical.averageFinish,1)}</div><div class="kpi-note">${historical.completedSeasons||0} completed seasons</div></div>
      <div class="kpi featured-kpi"><div class="label">Historical Average PPG</div><div class="value">${fmt(historical.averagePpg||0,2)}</div><div class="kpi-note">#${historical.historicalPpgRank||"-"} of ${analysis.totalRosters||"—"} · ${signed(historicalGap)} vs league average</div></div>
      <div class="kpi"><div class="label">Overall Record</div><div class="value compact-value">${historical.wins||0}-${historical.losses||0}${historical.ties?`-${historical.ties}`:""}</div><div class="kpi-note">Across matched linked seasons</div></div>
      <div class="kpi"><div class="label">Overall Win Percentage</div><div class="value">${fmt(winPct,1)}%</div><div class="kpi-note">Ties count as half a win</div></div>
    </div>
  </section>`;
}

function candidateHtml(players, type){
  const title=type==="build"?"Build Around":"Shop / Reassess";
  const empty=type==="build"?"No young, playable, high-value cornerstone meets the current screen.":"No aging, marketable contributor meets the current screen.";
  return `<section class="team-candidate-section ${type}"><div class="team-section-heading"><h3>${title}</h3><p>${type==="build"?"Young, playable assets with meaningful dynasty value.":"Older contributors who may warrant a value check before their market declines."}</p></div>
    ${players.length?`<div class="team-candidate-grid">${players.map(player=>`<article class="team-candidate-card"><h4>${esc(player.name)}</h4><div class="small">${esc(player.position)} · Age ${player.age??"—"} · ${esc(player.rosterStatus||"Rostered")}</div><dl><div><dt>Expected PPG</dt><dd>${fmt(player.expectedPpg,2)}</dd></div><div><dt>Dynasty value</dt><dd>${intFmt(player.dynastyValue)}</dd></div><div><dt>Risk</dt><dd>${esc(player.riskTier||"Unrated")}</dd></div></dl></article>`).join("")}</div>`:`<p class="small team-empty-copy">${empty}</p>`}
  </section>`;
}

function reviewHtml(reviews){
  if(!reviews.length)return `<section class="team-position-section"><div class="team-section-heading"><h3>Position, Bench & Draft Reviews</h3></div><p class="small team-empty-copy">Position review data is unavailable for this report.</p></section>`;
  return `<section class="team-position-section"><div class="team-section-heading"><h3>Position, Bench & Draft Reviews</h3><p>Every review compares the selected roster with the active league and includes a recommended action.</p></div><div class="team-position-review-grid">${reviews.map(review=>`<article class="team-position-review"><div class="team-position-review-heading"><div><h4>${esc(review.label)}</h4><p>${esc(review.status||"")}</p></div><span>${esc(review.action||"Review")}</span></div><p>${esc(review.summary||"")}</p><div class="team-review-data">${(review.metrics||[]).map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong></div>`).join("")}</div></article>`).join("")}</div></section>`;
}

function lineupTable(team){
  const headers=[
    {key:"slot",label:"Starter Slot"},
    {key:"name",label:"Player",render:row=>`<strong>${esc(row.name)}</strong><div class="table-subtext">${esc(row.position||"—")}${row.nflTeam?` · ${esc(row.nflTeam)}`:""}</div>`},
    {key:"positionRank",label:"Position Rank",num:true,render:row=>row.positionRank?`#${row.positionRank}${row.positionPoolSize?` of ${row.positionPoolSize}`:""}`:"—"},
    {key:"positionTier",label:"Tier",render:row=>`<span class="tier-chip ${tierClass(row.positionTier)}">${esc(row.positionTier||"Unrated")}</span>`},
    {key:"expectedPpg",label:"Projection",num:true,render:row=>`<strong>${fmt(row.expectedPpg,2)} EPPG</strong><div class="table-subtext">${fmt(row.projectedTotal,1)} season points</div>`},
    {key:"dynastyValue",label:"Dynasty Value",num:true,render:row=>intFmt(row.dynastyValue)},
    {key:"riskTier",label:"Risk",render:row=>`<span class="team-risk ${String(row.riskTier||"unrated").toLowerCase().replace(/\s+/g,"-")}">${esc(row.riskTier||"Unrated")}</span>`}
  ];
  const rows=(team.lineup||[]).map(entry=>({slot:entry.slot,...entry.player}));
  return `<section class="team-lineup-section"><div class="team-section-heading"><h3>Optimal Lineup Evidence</h3><p>Expected PPG is projected season total divided by 17. Taxi players are excluded.</p></div>${rows.length?sortableTable(headers,rows,"teamlineup"):`<p class="small team-empty-copy">No legal projected starters were available for this report.</p>`}</section>`;
}

function rosterTable(team){
  const headers=[
    {key:"rosterStatus",label:"Roster Status"},
    {key:"name",label:"Player",render:row=>`<strong>${esc(row.name)}</strong><div class="table-subtext">${esc(row.position||"—")}${row.nflTeam?` · ${esc(row.nflTeam)}`:""}</div>`},
    {key:"positionRank",label:"Position Rank",num:true,render:row=>row.positionRank?`#${row.positionRank}${row.positionPoolSize?` of ${row.positionPoolSize}`:""}`:"—"},
    {key:"positionTier",label:"Tier",render:row=>`<span class="tier-chip ${tierClass(row.positionTier)}">${esc(row.positionTier||"Unrated")}</span>`},
    {key:"expectedPpg",label:"Projection",num:true,render:row=>`<strong>${fmt(row.expectedPpg,2)} EPPG</strong><div class="table-subtext">${fmt(row.projectedTotal,1)} season points</div>`},
    {key:"dynastyValue",label:"Dynasty Value",num:true,render:row=>intFmt(row.dynastyValue)},
    {key:"riskTier",label:"Risk",render:row=>`<span class="team-risk ${String(row.riskTier||"unrated").toLowerCase().replace(/\s+/g,"-")}">${esc(row.riskTier||"Unrated")}</span>`}
  ];
  const rows=[...(team.players||[])].sort((a,b)=>{
    const statusOrder={Starter:0,Bench:1,Reserve:2,Taxi:3};
    return (statusOrder[a.rosterStatus]??4)-(statusOrder[b.rosterStatus]??4)||b.expectedPpg-a.expectedPpg;
  });
  return `<section class="team-roster-section"><div class="team-section-heading"><h3>Full Roster</h3><p>All rostered players, including bench, reserve, and taxi assignments.</p></div>${rows.length?sortableTable(headers,rows,"teamroster"):`<p class="small team-empty-copy">No rostered players are available for this report.</p>`}</section>`;
}

// Pure markup builder so regression tests can verify Team Insights without a DOM.
export function teamInsightsMarkup(analysis, selectedTeam){
  if(!analysis)return `<div class="panel team-insights-empty"><h2>Team Insights</h2><p>No analysis is loaded. Analyze a league to view team insights.</p></div>`;
  const team=focusedTeam(analysis,selectedTeam);
  if(!team)return `<div class="panel team-insights-empty"><h2>Team Insights</h2><p>This report does not contain any teams to review.</p></div>`;
  const insights=team.insights||{};
  const outlook=insights.championshipOutlook||{};
  return `<section class="panel team-insights-page">
    <div class="section-title team-insights-title"><div><h2>${esc(team.team)} Team Insights</h2><div class="small">Focused-team recommendations and evidence for the currently selected roster.</div></div><span class="${classCss(team.currentClass||"")}">${esc(team.currentClass||"Unclassified")}</span></div>
    ${analysis.unsupportedSlots?.length?`<div class="callout warn"><strong>Format warning:</strong> ${esc(analysis.unsupportedSlots.join(", "))} scoring is included, but public dynasty market values for IDP players may be incomplete.</div>`:""}
    <section class="team-recommendation"><div class="outlook-label">Championship Recommendation</div><h3>${esc(outlook.title||insights.strategy||"Review the roster before making a move")}</h3><div class="outlook-explanation">${(outlook.explanation||insights.strategyEvidence||"No recommendation is available for this report.").split("\n\n").filter(Boolean).map(paragraph=>`<p>${esc(paragraph)}</p>`).join("")}</div><div class="outlook-metrics">${(outlook.metrics||[]).map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong></div>`).join("")}</div></section>
    ${seasonAndPerformanceHtml(analysis,team)}
    <section class="team-kpi-section"><div class="team-section-heading"><h3>Roster Profile</h3><p>Supporting roster construction indicators beyond the season and historical performance summaries.</p></div><div class="kpis">
      <div class="kpi"><div class="label">Depth Index</div><div class="value">${fmt(team.depth,2)}</div></div>
      <div class="kpi"><div class="label">Dynasty Value</div><div class="value">${intFmt(team.totalValue)}</div></div>
      <div class="kpi"><div class="label">Lineup Risk</div><div class="value">${fmt(team.risk,1)}</div></div>
      <div class="kpi"><div class="label">Future 1sts</div><div class="value">${team.futureFirsts??0}</div></div>
    </div></section>
    ${teamInsightReviewHtml(insights.strengths||[],"strength")}
    ${teamInsightReviewHtml(insights.weaknesses||[],"weakness")}
    ${reviewHtml(insights.positionReviews||[])}
    <div class="team-candidate-layout">${candidateHtml(insights.build||[],"build")}${candidateHtml(insights.shop||[],"shop")}</div>
    ${lineupTable(team)}
    ${rosterTable(team)}
  </section>`;
}

export function renderTeams(){
  $("#teams").innerHTML=teamInsightsMarkup(state.analysis,state.selectedTeam);
}

// Retained as the public render.js export; Team Insights now renders as one
// coherent focused-team page, so it shares the main renderer implementation.
export function renderTeamDetail(){renderTeams();}
