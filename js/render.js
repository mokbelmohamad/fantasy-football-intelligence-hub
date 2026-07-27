import { state } from "./state.js";
import {
  $,
  $$,
  csvEscape,
  esc,
  fmt,
  intFmt,
  setSources,
} from "./utils.js";
import {
  classCss,
  eligible,
  tierClass,
} from "./league.js";
import {
  buildPlayerTierModel,
  prepareAnalysisForRender,
  tierDescription,
  tierLabel,
} from "./tiers.js";

export function evidenceHtml(items,type){
  return `<div class="insight-stack">${items.map(item=>`
    <div class="insight-evidence ${type}">
      <div class="evidence-title">${esc(item.title)}</div>
      <div class="evidence-detail">${esc(item.detail)}</div>
    </div>`).join("")}</div>`;
}

export function showDashboardShell(){
  if(!state.analysis)return;
  prepareAnalysisForRender(state.analysis);
  populateTeamSelectors();
  $("#landingPage").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#headerAppControls").classList.remove("hidden");
  $("#tabs").classList.remove("hidden");
  $("#exportPanel").classList.remove("hidden");
  $("#activeLeagueName").textContent=state.analysis.leagueName||"League Dashboard";
  $("#activeLeagueMeta").textContent=`ID ${state.analysis.leagueId} | ${state.analysis.formatLabel} | ${state.analysis.totalRosters} teams | Updated ${new Date(state.analysis.generatedAt).toLocaleString()}`;
  switchTab("dashboard");
  window.scrollTo({top:0,behavior:"smooth"});
}

export function showLanding(){
  $("#appShell").classList.add("hidden");
  $("#headerAppControls").classList.add("hidden");
  $("#tabs").classList.add("hidden");
  $("#exportPanel").classList.add("hidden");
  $("#landingPage").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
  setTimeout(()=>$("#leagueId").focus(),150);
}

export function sortableTable(headers,rows,id){
  const keys=headers.map(h=>h.key);return `<div class="table-wrap"><table data-table="${esc(id)}"><thead><tr>${headers.map(h=>`<th data-key="${esc(h.key)}">${esc(h.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td class="${h.num?"num":""}">${h.render?h.render(r):esc(r[h.key]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function setSelectedTeam(teamName){
  if(!state.analysis?.teams?.some(t=>t.team===teamName))return;
  state.selectedTeam=teamName;
  const global=$("#globalTeamSelect");
  if(global)global.value=teamName;
  renderDashboard();
  renderTeams();
  renderLineups();
  renderTrade();
  renderPlayers();
  renderTiers();
  renderPicks();
}

export function teamSelectOptions(selected){
  return state.analysis.teams.map(t=>`<option value="${esc(t.team)}" ${t.team===selected?"selected":""}>${esc(t.team)}</option>`).join("");
}

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

export function renderTeams(){
  const a=state.analysis;if(!a)return;
  const t=a.teams.find(x=>x.team===state.selectedTeam)||a.teams[0];
  $("#teams").innerHTML=`<div class="panel">
    <div class="section-title">
      <div><h2>Team-by-Team Insights</h2><div class="small">Use the top-banner team selector to change the focus team across all tabs.</div></div>
      
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
        <div><h2>Optimal Lineups</h2><div class="small">Use the top-banner team selector to update the focus team across all tabs.</div></div>
        
      </div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>${esc(focus.team)} Optimal Legal Lineup</h2><span class="${classCss(focus.currentClass)}">#${focus.currentRank} ${esc(focus.currentClass)}</span></div>
      <p class="small">Taxi players are excluded. Expected PPG is projected season total divided by 17.</p>
      ${sortableTable(h,focusRows,"focusedLineup")}
    </div>
    <div class="panel"><div class="section-title"><h2>All League Lineups</h2></div>${sortableTable(h,allRows,"allLineups")}</div>`;
  
}

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
      <div><h2>League Trade Finder</h2><div class="small">Use the top-banner team selector to refresh the focus roster throughout the application.</div></div>
      
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

export function teamShort(name){
  const words=String(name||"").trim().split(/\s+/);
  if(words.length===1)return words[0].slice(0,10);
  return words.map(w=>w[0]).join("").slice(0,5).toUpperCase();
}

export function pickChip(p,ownerTeam){
  const own=p.originTeam===ownerTeam;
  const label=own?`${p.season} R${p.round} Own`:`${p.season} R${p.round} from ${p.originTeam}`;
  const route=!own&&p.previousOwnerTeam&&p.previousOwnerTeam!==p.originTeam&&p.previousOwnerTeam!==ownerTeam
    ?` · last held by ${p.previousOwnerTeam}`:"";
  return `<span class="pick-chip ${own?"own":"acquired"}" title="${esc(`Original: ${p.originTeam}${route}`)}">${esc(label)}</span>`;
}

export function renderTiers(){
  const a=state.analysis,all=a.tierPlayers||buildPlayerTierModel(a.players||[]);
  $('#tiers').innerHTML=`<div class="panel"><div class="section-title"><div><h2>Player Tiers and Expected PPG</h2><div class="small">Composite tiers emphasize upcoming-season projection, then dynasty market value and expected career longevity.</div></div></div><div class="tier-page-controls"><input id="tierSearch" placeholder="Search player"><select id="tierPosition"><option value="">All positions</option><option>QB</option><option>RB</option><option>WR</option><option>TE</option></select><select id="tierLevel"><option value="">All tiers</option><option value="S">Tier S</option><option value="1">Tier 1</option><option value="2">Tier 2</option><option value="3">Tier 3</option><option value="4">Tier 4</option></select><select id="tierRoster"><option value="">Rostered + free agents</option><option value="Rostered">Rostered only</option><option value="Free Agent">Free agents only</option></select><select id="tierSort"><option value="composite">Sort: Composite tier score</option><option value="ppg">Sort: Expected PPG</option><option value="value">Sort: Dynasty value</option><option value="longevity">Sort: Longevity</option></select></div><div class="tier-summary">${['S','1','2','3','4'].map(t=>`<div class="tier-summary-card"><div class="tier-name">Tier ${t}</div><div class="tier-range">${esc(tierLabel(t))}</div><div class="small">${all.filter(p=>p.analysisTier===t).length} players</div></div>`).join('')}</div><div id="tierBoard"></div></div><div class="panel"><div class="section-title"><h2>Tier Methodology</h2></div><div class="tier-methodology-grid"><div class="tier-methodology-item"><strong>60% Upcoming Projection</strong>Expected PPG percentile among players at the same position. Expected PPG equals projected season total divided by 17.</div><div class="tier-methodology-item"><strong>25% Dynasty Value</strong>Consensus percentile using available RosterAudit and DynastyProcess values for the league format.</div><div class="tier-methodology-item"><strong>15% Career Longevity</strong>Age-curve score by position, adjusted for injury, role, NFL-team status, and the existing risk model.</div></div><div class="callout" style="margin-top:12px"><strong>Interpretation:</strong> These are analytical tiers created by this application, not copied rankings. Existing projection and dynasty-value sources are incorporated, while longevity is calculated internally.</div></div>`;
  ['tierSearch','tierPosition','tierLevel','tierRoster','tierSort'].forEach(id=>$('#'+id).addEventListener(id==='tierSearch'?'input':'change',renderTierBoard));renderTierBoard();
}

export function renderTierBoard(){
  const a=state.analysis;let rows=[...(a.tierPlayers||[])];const q=($('#tierSearch')?.value||'').toLowerCase(),pos=$('#tierPosition')?.value||'',level=$('#tierLevel')?.value||'',roster=$('#tierRoster')?.value||'',sort=$('#tierSort')?.value||'composite';
  rows=rows.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!pos||p.position===pos)&&(!level||p.analysisTier===level)&&(!roster||(roster==='Rostered'?p.rosterId>0:p.rosterStatus==='Free Agent')));
  const sorter={composite:(a,b)=>b.tierComposite-a.tierComposite,ppg:(a,b)=>b.expectedPpg-a.expectedPpg,value:(a,b)=>b.dynastyValue-a.dynastyValue,longevity:(a,b)=>b.longevityScore-a.longevityScore}[sort];rows.sort(sorter);
  const tiers=['S','1','2','3','4'].filter(t=>!level||t===level);
  $('#tierBoard').innerHTML=`<div class="tier-board">${tiers.map(t=>{const group=rows.filter(p=>p.analysisTier===t);if(!group.length)return '';return `<section class="tier-group"><div class="tier-group-header"><h3>Tier ${t} — ${esc(tierLabel(t))}</h3><div class="tier-explanation">${esc(tierDescription(t))} · ${group.length} players</div></div><div class="tier-player-grid">${group.map((p,i)=>`<article class="tier-player-card tier-${String(t).toLowerCase()}"><div class="tier-player-head"><div><div class="tier-player-name">#${i+1} ${esc(p.name)}</div><div class="tier-player-meta">${esc(p.position)}${p.nflTeam?` · ${esc(p.nflTeam)}`:''} · Age ${p.age??'—'} · ${esc(p.rosterStatus)}</div></div><div class="tier-score">${fmt(p.tierComposite,1)}<small>Tier score</small></div></div><div class="tier-metrics"><div class="tier-metric"><div class="value">${fmt(p.expectedPpg,2)}</div><div class="label">Expected PPG</div></div><div class="tier-metric"><div class="value">${intFmt(p.dynastyValue)}</div><div class="label">Dynasty value</div></div><div class="tier-metric"><div class="value">${fmt(p.longevityScore,0)}</div><div class="label">Longevity</div></div></div><div class="small" style="margin-top:8px">Projection ${fmt(p.projectionPct,0)}th pct · Value ${fmt(p.valuePct,0)}th pct · Longevity ${fmt(p.longevityPct,0)}th pct · ${esc(p.projectionSource)}</div></article>`).join('')}</div></section>`}).join('')}</div>`;
}

export function renderPicks(){
  const a=state.analysis,focus=a.teams.find(t=>t.team===state.selectedTeam)||a.teams[0];
  const maxCapital=Math.max(...a.teams.map(t=>t.pickCapital),1);
  const columns=[...new Set(a.picks.map(p=>`${p.season}|${p.round}`))]
    .map(x=>{const [season,round]=x.split("|").map(Number);return {season,round,key:x}})
    .sort((a,b)=>a.season-b.season||a.round-b.round);

  const cards=[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).map(team=>{
    const owned=[...team.picksOwned].sort((x,y)=>x.season-y.season||x.round-y.round);
    const acquired=owned.filter(p=>p.acquired);
    const sent=a.picks.filter(p=>p.originTeam===team.team&&p.ownerTeam!==team.team);
    return `<div class="capital-card ${team.team===state.selectedTeam?"focused":""}">
      <h3>${esc(team.team)}</h3>
      <div class="capital-meta">Capital rank #${[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).findIndex(x=>x.rosterId===team.rosterId)+1} · model value ${intFmt(team.pickCapital)}</div>
      <div class="mini-stat-row">
        <div class="mini-stat"><div class="n">${team.futureFirsts}</div><div class="l">Future 1sts</div></div>
        <div class="mini-stat"><div class="n">${owned.length}</div><div class="l">Total picks</div></div>
        <div class="mini-stat"><div class="n">${acquired.length}</div><div class="l">Acquired</div></div>
      </div>
      <div class="pick-chip-wrap">${owned.map(p=>pickChip(p,team.team)).join("")||'<span class="small">No future picks tracked.</span>'}</div>
      ${sent.length?`<div class="small" style="margin-top:9px"><strong>Sent away:</strong> ${sent.map(p=>`${p.season} R${p.round} → ${p.ownerTeam}`).join(" · ")}</div>`:""}
    </div>`;
  }).join("");

  const matrixRows=a.teams.map(team=>{
    const cells=columns.map(col=>{
      const owned=a.picks.filter(p=>p.ownerTeam===team.team&&p.season===col.season&&p.round===col.round);
      return `<td>${owned.length?owned.map(p=>{
        const own=p.originTeam===team.team;
        return `<span class="pick-chip ${own?"own":"acquired"}" title="${esc(`Original team: ${p.originTeam}${p.previousOwnerTeam?`; previous owner: ${p.previousOwnerTeam}`:""}`)}">${own?"Own":`From ${teamShort(p.originTeam)}`}</span>`;
      }).join(" "):'<span class="small">—</span>'}</td>`;
    }).join("");
    return `<tr class="${team.team===state.selectedTeam?"focused-row":""}"><td class="matrix-owner">${esc(team.team)}</td>${cells}</tr>`;
  }).join("");

  const acquiredFocus=focus.picksOwned.filter(p=>p.acquired);
  const sentFocus=a.picks.filter(p=>p.originTeam===focus.team&&p.ownerTeam!==focus.team);
  const movementAcquired=acquiredFocus.length?acquiredFocus.map(p=>`<div class="movement-item"><strong>${p.season} Round ${p.round} from ${esc(p.originTeam)}</strong><span class="small">Current owner: ${esc(focus.team)}${p.previousOwnerTeam&&p.previousOwnerTeam!==p.originTeam?` · Previous holder: ${esc(p.previousOwnerTeam)}`:""}</span></div>`).join(""):'<div class="movement-item">No acquired picks.</div>';
  const movementSent=sentFocus.length?sentFocus.map(p=>`<div class="movement-item"><strong>${p.season} Round ${p.round} sent to ${esc(p.ownerTeam)}</strong><span class="small">Original pick: ${esc(focus.team)}${p.previousOwnerTeam&&p.previousOwnerTeam!==focus.team?` · Last transfer from ${esc(p.previousOwnerTeam)}`:""}</span></div>`).join(""):'<div class="movement-item">No original picks sent away.</div>';

  $("#picks").innerHTML=`
    <div class="panel team-control-panel">
      <div class="section-title">
        <div><h2>Draft Capital</h2><div class="small">Use the top-banner team selector to highlight the focus team across cards, the ownership matrix and pick movement.</div></div>
        
      </div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Capital at a Glance</h2><span class="small">Relative model value across all tracked future picks</span></div>
      <div class="capital-leaderboard">${[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).map((team,i)=>`
        <div class="capital-row">
          <strong>#${i+1} ${esc(team.team)}</strong>
          <div class="capital-track"><div class="capital-fill" style="width:${100*team.pickCapital/maxCapital}%"></div></div>
          <span>${intFmt(team.pickCapital)} · ${team.futureFirsts} firsts</span>
        </div>`).join("")}</div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Team Pick Portfolios</h2><span class="small">Green = own pick; blue = acquired pick</span></div>
      <div class="capital-grid">${cards}</div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Ownership Matrix</h2><span class="small">Each cell shows whose original pick the current owner controls.</span></div>
      <div class="pick-matrix"><table><thead><tr><th>Current Owner</th>${columns.map(c=>`<th>${c.season} R${c.round}</th>`).join("")}</tr></thead><tbody>${matrixRows}</tbody></table></div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>${esc(focus.team)} Pick Movement</h2><span class="small">Acquired and sent picks</span></div>
      <div class="movement-grid">
        <div><h3>Acquired</h3><div class="movement-list">${movementAcquired}</div></div>
        <div><h3>Sent Away</h3><div class="movement-list">${movementSent}</div></div>
      </div>
    </div>`;
  
}

export function renderMethodology(){
  const a=state.analysis;
  $("#methodology").innerHTML=`<div class="panel"><h2>Methodology</h2>
    <div class="grid-2">
      <div><h3>Contender Score Weights</h3><ul class="insight-list">${Object.entries(a.weights).map(([k,v])=>`<li>${esc(k)}: ${(v*100).toFixed(0)}%</li>`).join("")}</ul></div>
      <div><h3>Detected League Settings</h3><ul class="insight-list"><li>${esc(a.formatLabel)}</li><li>${a.totalRosters} teams</li><li>Starting slots: ${esc(a.rosterSlots.join(", "))}</li><li>Current data through week ${a.currentWeek||0}</li></ul></div>
    </div>
    <h3>Calculation Notes</h3>${Object.entries(a.methodology).map(([k,v])=>`<div class="callout"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")}
    <h3>Classification</h3><p>Current rankings combine projected legal lineup strength, depth, recent production, dynasty value, risk and draft capital. Franchise rankings emphasize total dynasty value, young skill-position value and picks.</p><h3>Player Tiers</h3><p>The dedicated Player Tiers page uses a composite score: 60% upcoming-season expected PPG percentile, 25% dynasty-value percentile, and 15% position-adjusted longevity. Tier S represents elite cornerstone profiles, followed by Tiers 1 through 4. Team positional insights continue to use projection-based position ranks.</p>
    <h3>Important Limitations</h3><p>Preseason and in-season projections change quickly. Market values estimate sentiment rather than guaranteed trade prices. Rookie and IDP projections are less reliable. Refresh after major injuries, trades, depth-chart changes and at least weekly during the season.</p>
    <h3>Data Sources</h3><ul class="insight-list"><li>Sleeper public API: league, rosters, managers, matchups, players and traded picks.</li><li>RosterAudit: dynasty values and projections, with visible attribution.</li><li>DynastyProcess: secondary dynasty values and cross-platform IDs.</li></ul>
  </div>`;
}

export function populateTeamSelectors(){
  const first=state.analysis?.teams?.[0]?.team||"";
  if(!state.analysis.teams.some(t=>t.team===state.selectedTeam))state.selectedTeam=first;
  const global=$("#globalTeamSelect");
  if(global){
    global.innerHTML=teamSelectOptions(state.selectedTeam);
    global.value=state.selectedTeam;
  }
}

export function renderAll(){populateTeamSelectors();renderDashboard();renderTeams();renderLineups();renderTrade();renderPlayers();renderTiers();renderPicks();renderMethodology();setSources(state.analysis.sourceStatuses||[])}

export function switchTab(name){$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===name));$$(".view").forEach(v=>v.classList.toggle("active",v.id===name));if(name==="dashboard")requestAnimationFrame(drawRankChart)}

export function csvFrom(rows,columns){return [columns.map(x=>csvEscape(x.label)).join(","),...rows.map(r=>columns.map(x=>csvEscape(typeof x.get==="function"?x.get(r):r[x.key])).join(","))].join("\n")}
