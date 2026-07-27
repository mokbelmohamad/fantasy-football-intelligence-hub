import { API, APP_VERSION } from "./config.js";
import { state } from "./state.js";
import { idbSet } from "./storage.js";
import {
  $,
  clamp,
  log,
  mean,
  normName,
  nullable,
  num,
  setSources,
  sum,
} from "./utils.js";
import {
  collectProjectionPlayers,
  fetchJson,
  fetchText,
  field,
  getHistory,
  getLeagueBundle,
  getMatchups,
  loadPlayerDirectory,
  loadSleeperProjections,
  parseCSV,
} from "./api.js";
import {
  aggregatePlayerProduction,
  assignPlayerPositionTiers,
  buildPickOwnership,
  classCurrent,
  classFranchise,
  detectFormat,
  minCostLineup,
  percentile,
  riskFor,
  rosterPoints,
  scoringFormatLabel,
  starterSlots,
  teamName,
} from "./league.js";
import {
  buildTeamInsights,
  prepareAnalysisForRender,
} from "./tiers.js";
import {
  populateTeamSelectors,
  renderAll,
  showDashboardShell,
} from "./render.js";

export async function analyze(force=false){
  const leagueId=$("#leagueId").value.trim();
  if(!/^\d{10,25}$/.test(leagueId)){log("Enter a valid numeric Sleeper league ID.");return}
  const sourceStatuses=[];setSources([]);$("#analyzeBtn").disabled=true;$("#refreshBtn").disabled=true;
  try{
    log("Loading league settings, rosters and managers…",4);
    const [nflState,bundle]=await Promise.all([fetchJson(`${API.sleeper}/state/nfl`),getLeagueBundle(leagueId)]);
    sourceStatuses.push({name:"Sleeper league",status:"ok",detail:`${bundle.rosters.length} teams`});setSources(sourceStatuses);
    const formatKey=detectFormat(bundle.league,$("#formatOverride").value),historyDepth=num($("#historyDepth").value,3);
    log("Loading linked prior seasons…",10);
    const history=await getHistory(bundle,historyDepth);
    const currentSeason=Number(bundle.league.season);
    let maxWeek=0;
    if(bundle.league.status==="complete")maxWeek=18;
    else if(Number(nflState.season)===currentSeason&&["regular","post"].includes(nflState.season_type))maxWeek=clamp(num(nflState.leg||nflState.week),0,18);
    log(`Loading ${maxWeek} weeks of current-season matchups…`,16);
    const matchups=await getMatchups(leagueId,maxWeek);
    sourceStatuses.push({name:"Sleeper matchups",status:Object.keys(matchups).length?"ok":"warn",detail:`${Object.keys(matchups).length} weeks`});setSources(sourceStatuses);

    log("Loading player identity map…",25);
    const playerDirectory=await loadPlayerDirectory(force,sourceStatuses);setSources(sourceStatuses);

    log("Loading projections and dynasty values…",38);
    const external=await Promise.allSettled([
      fetchJson(`${API.raValues}?format_key=${encodeURIComponent(formatKey)}`,45000),
      fetchJson(API.raProjections,45000),
      fetchJson(API.raPicks,45000),
      fetchText(API.dpIds,45000),
      fetchText(API.dpValues,45000),
      loadSleeperProjections(currentSeason,sourceStatuses)
    ]);
    const raValues=external[0].status==="fulfilled"?external[0].value:{};
    const raProjRaw=external[1].status==="fulfilled"?external[1].value:{};
    const raPicks=external[2].status==="fulfilled"?external[2].value:{};
    const dpIds=external[3].status==="fulfilled"?parseCSV(external[3].value):[];
    const dpValues=external[4].status==="fulfilled"?parseCSV(external[4].value):[];
    const sleeperProj=external[5].status==="fulfilled"?external[5].value:new Map();
    sourceStatuses.push({name:"RosterAudit values",status:external[0].status==="fulfilled"?"ok":"warn",detail:external[0].status==="fulfilled"?"live":"unavailable"});
    sourceStatuses.push({name:"RosterAudit projections",status:external[1].status==="fulfilled"?"ok":"warn",detail:external[1].status==="fulfilled"?"live":"fallback used"});
    sourceStatuses.push({name:"DynastyProcess",status:external[3].status==="fulfilled"&&external[4].status==="fulfilled"?"ok":"warn",detail:"secondary values"});
    setSources(sourceStatuses);

    const users=new Map(bundle.users.map(u=>[String(u.user_id),u]));
    const teamMap=new Map(bundle.rosters.map(r=>[num(r.roster_id),teamName(users.get(String(r.owner_id)),r.roster_id)]));
    const production=aggregatePlayerProduction(matchups);
    const dpBySleeper=new Map(dpIds.filter(r=>r.sleeper_id&&r.sleeper_id!=="NA").map(r=>[String(r.sleeper_id),r]));
    const dpByFp=new Map(dpValues.filter(r=>r.fp_id&&r.fp_id!=="NA").map(r=>[String(r.fp_id),r]));
    const dpByName=new Map(dpValues.map(r=>[normName(r.player),r]));
    const raProj=collectProjectionPlayers(raProjRaw);
    const currentRosterById=new Map(bundle.rosters.map(r=>[num(r.roster_id),r]));

    log("Joining players, production, projections and market values…",55);
    const playerRows=[];
    for(const roster of bundle.rosters){
      const starters=new Set((roster.starters||[]).map(String)),taxi=new Set((roster.taxi||[]).map(String)),reserve=new Set((roster.reserve||[]).map(String));
      for(const raw of roster.players||[]){
        const id=String(raw);if(!id||id==="0")continue;
        const sp=playerDirectory[id]||{},idr=dpBySleeper.get(id)||{};
        const name=sp.full_name||[sp.first_name,sp.last_name].filter(Boolean).join(" ")||idr.name||id;
        const dp=(idr.fantasypros_id&&idr.fantasypros_id!=="NA"?dpByFp.get(String(idr.fantasypros_id)):null)||dpByName.get(normName(name))||{};
        const ra=raValues[id]||{};
        const rp=raProj.get(id)||{};
        const rpStats=Array.isArray(rp.stats)?(rp.stats.find(x=>String(x.year)===String(currentSeason))||rp.stats[0]||{}):{};
        const sl=sleeperProj.get(id)||{},slStats=sl.stats||sl;
        const prod=production.get(id)||{};
        const raPpg=nullable(rp.ppg_ppr??rp.ppg),raGames=nullable(rpStats.games);
        const slTotal=nullable(field(slStats,["pts_ppr","fantasy_points_ppr","pts_half_ppr","pts_std"]));
        const slGames=nullable(field(slStats,["gp","games","games_played"]));
        let projectedTotal=raPpg!==null&&raGames!==null?raPpg*raGames:slTotal;
        let projectedGames=raGames??slGames;
        let source=raPpg!==null?"RosterAudit":slTotal!==null?"Sleeper":"Actual fallback";
        const actualPpg=prod.scoringWeeks?prod.total/prod.scoringWeeks:0;
        if(projectedTotal===null||projectedTotal===undefined){projectedTotal=actualPpg*17;projectedGames=prod.scoringWeeks||null}
        const valRA=nullable(ra["1qb"]??ra["sf"]??rp.dynasty_val);
        const valDP=nullable(formatKey.startsWith("sf")?dp.value_2qb:dp.value_1qb);
        const vals=[valRA,valDP].filter(x=>x!==null),dynastyValue=vals.length?Math.round(mean(vals)):0;
        const p={
          rosterId:num(roster.roster_id),fantasyTeam:teamMap.get(num(roster.roster_id)),manager:users.get(String(roster.owner_id))?.display_name||"",
          sleeperId:id,name,position:sp.position||idr.position||"",nflTeam:sp.team||idr.team||"",age:nullable(sp.age??idr.age??dp.age),
          status:sp.status||"",injuryStatus:sp.injury_status||"",depthOrder:nullable(sp.depth_chart_order),
          rosterStatus:starters.has(id)?"Starter":taxi.has(id)?"Taxi":reserve.has(id)?"Reserve":"Bench",
          actualPoints:num(prod.total),actualPpg,rosteredWeeks:num(prod.weeks),scoringWeeks:num(prod.scoringWeeks),starts:num(prod.starts),
          starterPpg:prod.starts?prod.starterPoints/prod.starts:0,projectedTotal:num(projectedTotal),projectedGames,
          expectedPpg:num(projectedTotal)/17,sourcePpg:raPpg??(slTotal!==null?slTotal/17:actualPpg),projectionSource:source,
          dynastyValueRA:valRA,dynastyValueDP:valDP,dynastyValue,trend7d:nullable(ra.trend_7d),trend30d:nullable(ra.trend_30d),
          draftYear:nullable(idr.draft_year),draftRound:nullable(idr.draft_round),college:sp.college||idr.college||"",
          gsisId:idr.gsis_id&&idr.gsis_id!=="NA"?idr.gsis_id:"",fantasyProsId:idr.fantasypros_id&&idr.fantasypros_id!=="NA"?idr.fantasypros_id:"",ktcId:idr.ktc_id&&idr.ktc_id!=="NA"?idr.ktc_id:""
        };
        Object.assign(p,riskFor(p));playerRows.push(p);
      }
    }


    // Add relevant unrostered players for Player Tiers and Player Master.
    const rosteredIds=new Set(playerRows.map(p=>p.sleeperId));
    const candidateIds=new Set([...Object.keys(raValues||{}).map(String),...[...raProj.keys()].map(String),...[...sleeperProj.keys()].map(String),...dpIds.map(r=>String(r.sleeper_id||'')).filter(Boolean)]);
    for(const id of candidateIds){
      if(!id||id==='NA'||rosteredIds.has(id))continue;
      const sp=playerDirectory[id]||{},idr=dpBySleeper.get(id)||{};const position=sp.position||idr.position||'';if(!['QB','RB','WR','TE'].includes(position))continue;
      const name=sp.full_name||[sp.first_name,sp.last_name].filter(Boolean).join(' ')||idr.name||id;
      const dp=(idr.fantasypros_id&&idr.fantasypros_id!=='NA'?dpByFp.get(String(idr.fantasypros_id)):null)||dpByName.get(normName(name))||{};
      const ra=raValues[id]||{},rp=raProj.get(id)||{};const rpStats=Array.isArray(rp.stats)?(rp.stats.find(x=>String(x.year)===String(currentSeason))||rp.stats[0]||{}):{};
      const sl=sleeperProj.get(id)||{},slStats=sl.stats||sl;const raPpg=nullable(rp.ppg_ppr??rp.ppg),raGames=nullable(rpStats.games);const slTotal=nullable(field(slStats,['pts_ppr','fantasy_points_ppr','pts_half_ppr','pts_std']));const slGames=nullable(field(slStats,['gp','games','games_played']));
      let projectedTotal=raPpg!==null&&raGames!==null?raPpg*raGames:slTotal;let projectedGames=raGames??slGames;if(projectedTotal===null||projectedTotal===undefined)projectedTotal=0;
      const valRA=nullable(ra['1qb']??ra['sf']??rp.dynasty_val);const valDP=nullable(formatKey.startsWith('sf')?dp.value_2qb:dp.value_1qb);const vals=[valRA,valDP].filter(x=>x!==null),dynastyValue=vals.length?Math.round(mean(vals)):0;
      const relevant=num(projectedTotal)>20||dynastyValue>150||String(sp.status||'').toLowerCase()==='active';if(!relevant)continue;
      const p={rosterId:0,fantasyTeam:'Free Agent',manager:'',sleeperId:id,name,position,nflTeam:sp.team||idr.team||'',age:nullable(sp.age??idr.age??dp.age),status:sp.status||'',injuryStatus:sp.injury_status||'',depthOrder:nullable(sp.depth_chart_order),rosterStatus:'Free Agent',actualPoints:0,actualPpg:0,rosteredWeeks:0,scoringWeeks:0,starts:0,starterPpg:0,projectedTotal:num(projectedTotal),projectedGames,expectedPpg:num(projectedTotal)/17,sourcePpg:raPpg??(slTotal!==null?slTotal/17:0),projectionSource:raPpg!==null?'RosterAudit':slTotal!==null?'Sleeper':'No projection',dynastyValueRA:valRA,dynastyValueDP:valDP,dynastyValue,trend7d:nullable(ra.trend_7d),trend30d:nullable(ra.trend_30d),draftYear:nullable(idr.draft_year),draftRound:nullable(idr.draft_round),college:sp.college||idr.college||'',gsisId:idr.gsis_id&&idr.gsis_id!=='NA'?idr.gsis_id:'',fantasyProsId:idr.fantasypros_id&&idr.fantasypros_id!=='NA'?idr.fantasypros_id:'',ktcId:idr.ktc_id&&idr.ktc_id!=='NA'?idr.ktc_id:''};
      Object.assign(p,riskFor(p));playerRows.push(p);
    }

    log("Solving legal optimal lineups and draft-pick ownership…",68);
    const slots=starterSlots(bundle.league);
    const pickOwnership=buildPickOwnership(bundle,num($("#futureYears").value,3),teamMap,raPicks);
    const prior=history[1]||null;
    const priorByRoster=new Map((prior?.rosters||[]).map(r=>[num(r.roster_id),r]));
    const teams=[];
    for(const roster of bundle.rosters){
      const rid=num(roster.roster_id),teamPlayers=playerRows.filter(p=>p.rosterId===rid),solved=minCostLineup(slots,teamPlayers);
      const assigned=solved.assigned,bench=solved.bench;
      const lineupPpg=sum(assigned,x=>x.player.expectedPpg),lineupSourcePpg=sum(assigned,x=>x.player.sourcePpg);
      const topBench=bench.filter(p=>["QB","RB","WR","TE","K","DEF"].includes(p.position)).sort((a,b)=>b.expectedPpg-a.expectedPpg).slice(0,6);
      const depth=sum(topBench,x=>x.expectedPpg)*.45;
      const weights=assigned.map(x=>Math.max(x.player.expectedPpg,.1)),risk=weights.length?assigned.reduce((a,x,i)=>a+x.player.riskScore*weights[i],0)/sum(weights):100;
      const ages=assigned.filter(x=>x.player.age!==null),lineupAge=ages.length?ages.reduce((a,x)=>a+x.player.age*Math.max(x.player.expectedPpg,.1),0)/sum(ages,x=>Math.max(x.player.expectedPpg,.1)):0;
      const positionScores={};
      for(const x of assigned){const group=x.slot==="SUPER_FLEX"?"SUPER_FLEX":x.slot.includes("FLEX")?"FLEX":x.player.position;positionScores[group]=(positionScores[group]||0)+x.player.expectedPpg}
      const currentSettings=roster.settings||{},priorRoster=priorByRoster.get(rid),priorSettings=priorRoster?.settings||{};
      const picksOwned=pickOwnership.filter(p=>p.ownerRosterId===rid);
      teams.push({
        rosterId:rid,team:teamMap.get(rid),manager:users.get(String(roster.owner_id))?.display_name||"",
        players:teamPlayers,lineup:assigned,bench,positionScores,lineupPpg,lineupSourcePpg,depth,risk,lineupAge,
        highRiskStarters:assigned.filter(x=>x.player.riskScore>=40).length,totalValue:sum(teamPlayers,p=>p.dynastyValue),
        lineupValue:sum(assigned,x=>x.player.dynastyValue),youngValue:sum(teamPlayers.filter(p=>p.age!==null&&p.age<27&&["RB","WR","TE"].includes(p.position)),p=>p.dynastyValue),
        currentWins:num(currentSettings.wins),currentLosses:num(currentSettings.losses),currentPF:rosterPoints(currentSettings,"fpts"),currentMaxPF:rosterPoints(currentSettings,"ppts"),
        priorWins:num(priorSettings.wins),priorLosses:num(priorSettings.losses),priorPF:rosterPoints(priorSettings,"fpts"),priorMaxPF:rosterPoints(priorSettings,"ppts"),
        pickCapital:sum(picksOwned,p=>p.value),futureFirsts:picksOwned.filter(p=>p.round===1).length,picksOwned
      });
    }

    log("Ranking teams and generating strategic insights…",80);
    const metrics={
      projection:teams.map(t=>t.lineupPpg),depth:teams.map(t=>t.depth),dynasty:teams.map(t=>t.totalValue),risk:teams.map(t=>t.risk),
      picks:teams.map(t=>t.pickCapital),young:teams.map(t=>t.youngValue)
    };
    const useCurrent=maxWeek>=4&&teams.some(t=>t.currentPF>0);
    const productionMetric=teams.map(t=>useCurrent?(t.currentPF+t.currentMaxPF)/2:(t.priorPF+t.priorMaxPF)/2);
    const weightInputs={projection:num($("#wProjection").value),depth:num($("#wDepth").value),history:num($("#wHistory").value),dynasty:num($("#wDynasty").value),risk:num($("#wRisk").value),picks:num($("#wPicks").value)};
    const wTotal=sum(Object.values(weightInputs))||100;Object.keys(weightInputs).forEach(k=>weightInputs[k]/=wTotal);
    for(const t of teams){
      t.projectionPct=percentile(metrics.projection,t.lineupPpg);t.depthPct=percentile(metrics.depth,t.depth);
      t.productionPct=percentile(productionMetric,useCurrent?(t.currentPF+t.currentMaxPF)/2:(t.priorPF+t.priorMaxPF)/2);
      t.dynastyPct=percentile(metrics.dynasty,t.totalValue);t.riskPct=percentile(metrics.risk,t.risk,false);
      t.picksPct=percentile(metrics.picks,t.pickCapital);t.youngPct=percentile(metrics.young,t.youngValue);
      t.contenderScore=wTotal?100*(weightInputs.projection*t.projectionPct+weightInputs.depth*t.depthPct+weightInputs.history*t.productionPct+weightInputs.dynasty*t.dynastyPct+weightInputs.risk*t.riskPct+weightInputs.picks*t.picksPct):0;
      t.franchiseScore=.40*t.dynastyPct+.25*t.youngPct+.15*t.picksPct+.10*t.projectionPct+.10*t.riskPct;
    }
    teams.sort((a,b)=>b.contenderScore-a.contenderScore).forEach((t,i)=>t.currentRank=i+1);
    [...teams].sort((a,b)=>b.franchiseScore-a.franchiseScore).forEach((t,i)=>t.franchiseRank=i+1);
    for(const t of teams){t.currentClass=classCurrent(t.currentRank,teams.length);t.franchiseClass=classFranchise(t.franchiseRank,teams.length)}
    assignPlayerPositionTiers(playerRows);
    for(const t of teams)t.insights=buildTeamInsights(t,teams);

    const unsupportedSlots=slots.filter(s=>["DL","LB","DB","IDP_FLEX"].includes(s));
    const analysis={
      appVersion:APP_VERSION,generatedAt:new Date().toISOString(),leagueId,leagueName:bundle.league.name,season:currentSeason,
      leagueStatus:bundle.league.status,currentWeek:maxWeek,totalRosters:bundle.rosters.length,formatKey,formatLabel:scoringFormatLabel(formatKey),
      rosterSlots:slots,unsupportedSlots,weights:weightInputs,useCurrentProduction:useCurrent,teams,players:playerRows,
      picks:pickOwnership,sourceStatuses,history:history.map(h=>({leagueId:h.league.league_id,season:h.league.season,name:h.league.name,status:h.league.status})),
      methodology:{
        projection:"Legal lineups are solved using projected season totals divided by 17, which adjusts for projected missed games.",
        production:useCurrent?"Current-season points-for and maximum points are used.":"The most recent completed linked season is used until enough current-season data exists.",
        dynasty:"Consensus is the mean of available RosterAudit and DynastyProcess values.",
        risk:"Rule-based screening using age curve, injury/status, depth role, projected games and value fragility.",
        picks:"Future pick ownership comes from Sleeper traded-pick records. Mid-round fallback values are used for team-level scoring."
      }
    };
    state.analysis=prepareAnalysisForRender(analysis);await idbSet(`analysis:${leagueId}`,state.analysis);
    populateTeamSelectors();renderAll();showDashboardShell();
    log(`Complete: ${bundle.league.name}\n${teams.length} teams · ${playerRows.length} rostered players · ${maxWeek} current-season weeks · ${history.length} linked seasons`,100);
  }catch(e){
    console.error(e);log(`Analysis failed:\n${e.message}\n\nTry Force Refresh in Chrome or Edge. Some third-party sources may temporarily block browser requests.`,0);
    sourceStatuses.push({name:"Run",status:"bad",detail:e.message});setSources(sourceStatuses);
  }finally{$("#analyzeBtn").disabled=false;$("#refreshBtn").disabled=false}
}
