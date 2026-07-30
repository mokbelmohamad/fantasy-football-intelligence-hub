import { clamp, num, nullable } from "./utils.js";

// League-domain calculations. These turn Sleeper's raw rules and rosters into
// the football concepts used throughout the report.
export function detectFormat(league,override){
  // sf = superflex; rec is points per reception; tep is tight-end premium.
  if(override!=="auto")return override;
  const slots=league.roster_positions||[];
  const sf=slots.includes("SUPER_FLEX")||slots.filter(x=>x==="QB").length>1;
  const rec=num(league.scoring_settings?.rec,0);
  const ppr=rec>=.75?"ppr":"half";
  const tep=num(league.scoring_settings?.bonus_rec_te,0)>0||num(league.scoring_settings?.rec_te,0)>rec;
  if(sf&&tep&&ppr==="ppr")return "sf_ppr_tep";
  return `${sf?"sf":"1qb"}_${ppr}`;
}


export function deriveStarterCount(source){
  // Older saved reports can describe slots differently. Prefer explicit values,
  // then derive a count from roster rules or the common lineup length.
  const directCandidates=[
    source?.starterCount,
    source?.detectedSetup?.starterCount,
  ];
  for(const candidate of directCandidates){
    const value=Number(candidate);
    if(Number.isFinite(value)&&value>0)return value;
  }

  const slotCandidates=[
    source?.starterSlots,
    source?.rosterSlots,
    source?.roster_positions,
    source?.rosterPositions,
    source?.league?.roster_positions,
    source?.settings?.roster_positions,
  ];
  const slots=slotCandidates.find(Array.isArray);
  if(slots){
    const excluded=new Set(["BN","BENCH","IR","RESERVE","TAXI"]);
    const count=slots.filter(slot=>!excluded.has(String(slot).toUpperCase())).length;
    if(count>0)return count;
  }

  const lineupLengths=(source?.teams||[])
    .map(team=>Array.isArray(team?.lineup)?team.lineup.length:0)
    .filter(length=>length>0);
  if(lineupLengths.length){
    const counts=new Map();
    for(const length of lineupLengths)counts.set(length,(counts.get(length)||0)+1);
    return [...counts.entries()]
      .sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0][0];
  }

  return null;
}

export function starterSlots(league){
  const ignore=new Set(["BN","IR","TAXI"]);
  const slots=(league.roster_positions||[]).filter(x=>!ignore.has(x));
  return slots.length?slots:["QB","RB","RB","WR","WR","WR","TE","FLEX","FLEX","FLEX"];
}

export function eligible(slot,pos){
  // Answers whether a player's real position can legally fill a roster slot.
  if(slot===pos)return true;
  if(["FLEX","WRT","REC_FLEX"].includes(slot))return ["RB","WR","TE"].includes(pos);
  if(["WRRB_FLEX","RB_WR_FLEX"].includes(slot))return ["RB","WR"].includes(pos);
  if(slot==="WR_TE_FLEX")return ["WR","TE"].includes(pos);
  if(slot==="SUPER_FLEX")return ["QB","RB","WR","TE"].includes(pos);
  if(slot==="IDP_FLEX")return ["DL","LB","DB","DE","DT","CB","S"].includes(pos);
  if(slot==="DL")return ["DL","DE","DT"].includes(pos);
  if(slot==="DB")return ["DB","CB","S"].includes(pos);
  return false;
}

export function scoringFormatLabel(key){return ({
  "1qb_ppr":"1QB PPR","1qb_half":"1QB Half PPR","sf_ppr":"Superflex PPR",
  "sf_half":"Superflex Half PPR","sf_ppr_tep":"Superflex PPR TEP"
})[key]||key}

export function detectFuturePickHorizon(bundle, override="auto"){
  // Use observed pick seasons but keep the analysis window sensibly bounded.
  const currentSeason=num(bundle?.league?.season,new Date().getFullYear());
  if(override!=="auto"){
    const years=clamp(num(override,3),1,8);
    return {years,startSeason:currentSeason+1,endSeason:currentSeason+years,source:"override"};
  }
  const seasons=[
    ...(bundle?.tradedPicks||[]).map(p=>num(p.season)),
    ...(bundle?.drafts||[]).map(d=>num(d.season)),
  ].filter(y=>y>currentSeason);
  const observedEnd=seasons.length?Math.max(...seasons):currentSeason+3;
  const endSeason=Math.max(currentSeason+2,Math.min(currentSeason+8,observedEnd));
  return {
    years:endSeason-currentSeason,
    startSeason:currentSeason+1,
    endSeason,
    source:seasons.length?"league data":"default horizon",
  };
}

export function describeDetectedLeague(league, formatKey, history, pickHorizon){
  const teams=num(league?.total_rosters)||num(league?.settings?.num_teams);
  const starters=starterSlots(league);
  const idp=starters.some(slot=>["DL","LB","DB","DE","DT","CB","S","IDP_FLEX"].includes(slot));
  const seasons=(history||[]).map(item=>num(item?.league?.season)).filter(Boolean).sort((a,b)=>a-b);
  return {
    teams,
    formatLabel:scoringFormatLabel(formatKey),
    starterCount:starters.length,
    idp,
    historyStart:seasons[0]||num(league?.season),
    historyEnd:seasons.at(-1)||num(league?.season),
    pickStart:pickHorizon?.startSeason,
    pickEnd:pickHorizon?.endSeason,
  };
}


export function seasonStandings(bundle){
  const rosters=[...(bundle?.rosters||[])];
  return rosters.sort((a,b)=>{
    const as=a.settings||{},bs=b.settings||{};
    return num(bs.wins)-num(as.wins)||num(bs.ties)-num(as.ties)||rosterPoints(bs,"fpts")-rosterPoints(as,"fpts")||num(a.roster_id)-num(b.roster_id);
  }).map((roster,index)=>({rosterId:num(roster.roster_id),finish:index+1}));
}

export function buildHistoricalTeamSummaries(history,currentRosters){
  // Match prior teams by manager first (roster numbers can change), then by ID.
  const current=(currentRosters||history?.[0]?.rosters||[]);
  const summaries=new Map();
  const ownerByRoster=new Map(current.map(r=>[num(r.roster_id),String(r.owner_id||"")]));
  for(const roster of current){
    summaries.set(num(roster.roster_id),{
      seasonsMatched:0,completedSeasons:0,games:0,wins:0,losses:0,ties:0,points:0,
      averagePpg:0,averageFinish:null,historicalPpgRank:null,historicalLeagueAverage:0,
      finishes:[],currentStanding:null,currentRecord:"0-0"
    });
  }

  for(const [seasonIndex,bundle] of (history||[]).entries()){
    const standings=seasonStandings(bundle);
    const finishByRoster=new Map(standings.map(x=>[x.rosterId,x.finish]));
    const byOwner=new Map((bundle.rosters||[]).map(r=>[String(r.owner_id||""),r]));
    const byRoster=new Map((bundle.rosters||[]).map(r=>[num(r.roster_id),r]));
    for(const currentRoster of current){
      const currentRid=num(currentRoster.roster_id),ownerId=ownerByRoster.get(currentRid);
      const matched=(ownerId&&byOwner.get(ownerId))||byRoster.get(currentRid);
      if(!matched)continue;
      const out=summaries.get(currentRid),settings=matched.settings||{};
      const wins=num(settings.wins),losses=num(settings.losses),ties=num(settings.ties),games=wins+losses+ties;
      const points=rosterPoints(settings,"fpts");
      out.seasonsMatched++;
      if(games>0){out.games+=games;out.wins+=wins;out.losses+=losses;out.ties+=ties;out.points+=points;}
      if(seasonIndex===0){
        out.currentStanding=finishByRoster.get(num(matched.roster_id))||null;
        out.currentRecord=`${wins}-${losses}${ties?`-${ties}`:""}`;
      }
      if(bundle?.league?.status==="complete"){
        const finish=finishByRoster.get(num(matched.roster_id));
        if(finish){out.finishes.push(finish);out.completedSeasons++;}
      }
    }
  }

  const values=[];
  for(const [rid,out] of summaries){
    out.averagePpg=out.games?out.points/out.games:0;
    out.averageFinish=out.finishes.length?meanNumbers(out.finishes):null;
    if(out.games)values.push({rid,value:out.averagePpg});
  }
  const leagueAverage=values.length?meanNumbers(values.map(x=>x.value)):0;
  values.sort((a,b)=>b.value-a.value||a.rid-b.rid);
  values.forEach((entry,index)=>{summaries.get(entry.rid).historicalPpgRank=index+1;});
  for(const out of summaries.values())out.historicalLeagueAverage=leagueAverage;
  return summaries;
}

// Produces a chart-ready seasonal history for each current roster. Teams are
// matched by owner first so a Sleeper roster-number change does not break the
// franchise timeline. Each weekly value is that roster's Sleeper matchup score.
export function buildHistoricalTeamWeeklyPpg(history, matchupHistory, currentRosters){
  const current=currentRosters||history?.[0]?.rosters||[];
  const out=new Map(current.map(r=>[num(r.roster_id),[]]));
  for(const bundle of history||[]){
    const leagueId=String(bundle?.league?.league_id||"");
    const season=num(bundle?.league?.season);
    const byOwner=new Map((bundle.rosters||[]).map(r=>[String(r.owner_id||""),r]));
    const byRoster=new Map((bundle.rosters||[]).map(r=>[num(r.roster_id),r]));
    const seasonMatchups=matchupHistory?.get(leagueId)||{};
    for(const currentRoster of current){
      const rosterId=num(currentRoster.roster_id);
      const matched=byOwner.get(String(currentRoster.owner_id||""))||byRoster.get(rosterId);
      if(!matched)continue;
      const weekly=Object.entries(seasonMatchups).map(([week,entries])=>{
        const weekNumber=num(week);
        // Historical API data can include Week 18. It falls after the fantasy
        // championship and therefore is not a valid team-history data point.
        if(weekNumber<1||weekNumber>17)return null;
        const entry=(entries||[]).find(item=>num(item.roster_id)===num(matched.roster_id));
        // Do not turn a missing score into zero. A numeric zero is retained as
        // a real reported score; absent/non-numeric scores are not chart data.
        const points=entry?.points;
        return Number.isFinite(Number(points))?{week:weekNumber,points:Number(points)}:null;
      }).filter(Boolean).sort((a,b)=>a.week-b.week);
      const settings=matched.settings||{};
      out.get(rosterId).push({
        season,
        complete:bundle?.league?.status==="complete",
        weekly,
        wins:num(settings.wins),
        losses:num(settings.losses),
        ties:num(settings.ties),
        ppg:weekly.length?meanNumbers(weekly.map(item=>item.points)):0,
      });
    }
  }
  for(const seasons of out.values())seasons.sort((a,b)=>a.season-b.season);
  return out;
}

function meanNumbers(values){return values.length?values.reduce((a,b)=>a+num(b),0)/values.length:0;}

export function aggregatePlayerProduction(matchups){
  // m maps each Sleeper player ID to running production totals and weekly data.
  const m=new Map();
  for(const [weekText,entries] of Object.entries(matchups)){
    const week=Number(weekText);
    // Week 18 is outside the fantasy schedule and cannot influence player,
    // roster, or team performance metrics.
    if(!Number.isFinite(week)||week<1||week>17)continue;
    for(const entry of entries||[]){
      const starters=new Set((entry.starters||[]).map(String).filter(x=>x!=="0"));
      const points=entry.players_points||{};
      const playerList=new Set([...(entry.players||[]).map(String),...Object.keys(points)]);
      for(const pid of playerList){
        if(!m.has(pid))m.set(pid,{total:0,weeks:0,scoringWeeks:0,starts:0,starterPoints:0,weekly:[]});
        const r=m.get(pid),p=num(points[pid],0);r.total+=p;r.weeks++;if(p!==0)r.scoringWeeks++;if(starters.has(pid)){r.starts++;r.starterPoints+=p}r.weekly.push({week,points:p});
      }
    }
  }
  return m;
}

export function teamName(user,rosterId){return user?.metadata?.team_name||user?.display_name||user?.username||`Roster ${rosterId}`}

export function rosterPoints(settings,prefix="fpts"){return num(settings?.[prefix])+num(settings?.[`${prefix}_decimal`])/100}

export function riskFor(p){
  // Transparent rule-based risk score; reasons records why points were added.
  let score=0,reasons=[];const age=nullable(p.age),pos=p.position;
  if(age!==null){
    let a=0;
    if(pos==="RB")a=age>=29?50:age>=28?40:age>=27?30:age>=26?20:age>=24?10:0;
    else if(pos==="WR")a=age>=31?50:age>=30?40:age>=29?30:age>=28?20:age>=26?10:0;
    else if(pos==="TE")a=age>=32?45:age>=31?40:age>=30?30:age>=29?20:age>=27?10:0;
    else if(pos==="QB")a=age>=37?40:age>=34?25:age>=30?10:0;
    score+=a;if(a>=30)reasons.push(`age curve (${age})`);else if(a>=10)reasons.push(`some age exposure (${age})`);
  }
  const inj=String(p.injuryStatus||"").toLowerCase();
  if(inj){const x=/ir|pup|out/.test(inj)?25:/doubt/.test(inj)?18:/question/.test(inj)?10:6;score+=x;reasons.push(`injury: ${p.injuryStatus}`)}
  if(p.status&&String(p.status).toLowerCase()!=="active"){score+=20;reasons.push(`status: ${p.status}`)}
  if(!p.nflTeam||p.nflTeam==="FA"){score+=20;reasons.push("not on NFL team")}
  if(num(p.depthOrder)>=3){score+=15;reasons.push(`depth order ${p.depthOrder}`)}else if(num(p.depthOrder)===2){score+=7;reasons.push("secondary role")}
  const games=nullable(p.projectedGames);
  if(games!==null){if(games<10){score+=25;reasons.push(`only ${games} projected games`)}else if(games<14){score+=15;reasons.push(`only ${games} projected games`)}else if(games<16){score+=5;reasons.push(`${games} projected games`)}}
  if(num(p.expectedPpg)>=12&&num(p.dynastyValue)<1000){score+=12;reasons.push("production/value fragility")}
  // Keep the original score/tier names for callers while also exposing the
  // normalized player fields consumed by report tables and candidate cards.
  score=Math.min(100,score);const tier=score>=60?"Very High":score>=40?"High":score>=20?"Moderate":"Low";
  return {score,tier,riskScore:score,riskTier:tier,reasons};
}

export function minCostLineup(slots,players){
  // Minimizes negative projected points, which maximizes a legal lineup's PPG.
  const candidates=players.filter(p=>p.rosterStatus!=="Taxi"&&num(p.expectedPpg)>0);
  const nSlots=slots.length,nPlayers=candidates.length,N=2+nSlots+nPlayers,S=0,T=N-1,graph=Array.from({length:N},()=>[]);
  function add(u,v,cap,cost,meta=null){const a={to:v,rev:graph[v].length,cap,cost,meta},b={to:u,rev:graph[u].length,cap:0,cost:-cost,meta:null};graph[u].push(a);graph[v].push(b)}
  slots.forEach((slot,i)=>add(S,1+i,1,0));
  candidates.forEach((p,j)=>add(1+nSlots+j,T,1,0));
  slots.forEach((slot,i)=>candidates.forEach((p,j)=>{if(eligible(slot,p.position))add(1+i,1+nSlots+j,1,-Math.round(num(p.expectedPpg)*1000),{slotIndex:i,playerIndex:j})}));
  let flow=0;
  while(flow<nSlots){
    const dist=Array(N).fill(Infinity),inQ=Array(N).fill(false),pv=Array(N),pe=Array(N),q=[S];dist[S]=0;inQ[S]=true;
    while(q.length){const u=q.shift();inQ[u]=false;graph[u].forEach((e,idx)=>{if(e.cap>0&&dist[e.to]>dist[u]+e.cost){dist[e.to]=dist[u]+e.cost;pv[e.to]=u;pe[e.to]=idx;if(!inQ[e.to]){q.push(e.to);inQ[e.to]=true}}})}
    if(!Number.isFinite(dist[T]))break;
    for(let v=T;v!==S;v=pv[v]){const e=graph[pv[v]][pe[v]];e.cap--;graph[v][e.rev].cap++}flow++;
  }
  const assigned=[];for(let i=0;i<nSlots;i++){for(const e of graph[1+i])if(e.meta&&e.cap===0)assigned.push({slot:slots[i],player:candidates[e.meta.playerIndex]})}
  const used=new Set(assigned.map(x=>x.player.sleeperId));return {assigned,bench:players.filter(p=>!used.has(p.sleeperId)&&p.rosterStatus!=="Taxi")};
}

export function percentile(values,value,high=true){
  const clean=values.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(clean.length<=1)return 50;
  const v=high?value:-value,arr=high?clean:clean.map(x=>-x).sort((a,b)=>a-b);
  const below=arr.filter(x=>x<v).length,equal=arr.filter(x=>x===v).length;
  return ((below+(equal-1)/2)/(arr.length-1))*100;
}

export function classCurrent(rank,n){
  const q=rank/n;if(q<=.25)return "Championship Favorite";if(q<=.45)return "Strong Contender";if(q<=.65)return "Fringe Contender";if(q<=.82)return "Middle Tier";return "Rebuild / Non-Contender";
}

export function classFranchise(rank,n){
  const q=rank/n;if(q<=.25)return "Elite Long-Term";if(q<=.5)return "Strong & Sustainable";if(q<=.75)return "Mixed / Retool";return "Rebuild Required";
}

export function classCss(c){if(c.includes("Favorite")||c.includes("Elite"))return "class-favorite";if(c.includes("Strong"))return "class-strong";if(c.includes("Fringe")||c.includes("Middle")||c.includes("Mixed"))return "class-fringe";return "class-rebuild"}

export function buildPickOwnership(bundle,futureYears,teamMap,raPickData){
  // Starts each future pick with its original roster, then applies trades so the
  // report credits value to its current owner. raPickData supplies market values.
  const year0=Number(bundle.league.season)+1;
  const rounds=clamp(num(bundle.league.settings?.draft_rounds,4),1,8);
  const ownership=[];const raw=new Map();
  for(let y=year0;y<year0+futureYears;y++){
    for(const rid of teamMap.keys()){
      for(let r=1;r<=rounds;r++){
        raw.set(`${y}|${rid}|${r}`,{
          ownerRosterId:rid,
          previousOwnerRosterId:rid,
          traded:false
        });
      }
    }
  }
  for(const p of bundle.tradedPicks||[]){
    const y=num(p.season),origin=num(p.roster_id),round=num(p.round);
    if(y>=year0&&y<year0+futureYears){
      raw.set(`${y}|${origin}|${round}`,{
        ownerRosterId:num(p.owner_id),
        previousOwnerRosterId:num(p.previous_owner_id,p.owner_id),
        traded:num(p.owner_id)!==origin
      });
    }
  }
  const fallback={1:4000,2:1800,3:800,4:350,5:150,6:80,7:40,8:20};
  for(const [key,route] of raw){
    const [season,origin,round]=key.split("|").map(Number);
    ownership.push({
      season,round,
      originRosterId:origin,
      ownerRosterId:route.ownerRosterId,
      previousOwnerRosterId:route.previousOwnerRosterId,
      originTeam:teamMap.get(origin),
      ownerTeam:teamMap.get(route.ownerRosterId),
      previousOwnerTeam:teamMap.get(route.previousOwnerRosterId),
      acquired:route.ownerRosterId!==origin,
      traded:route.traded,
      value:fallback[round]||10
    });
  }
  return ownership.sort((a,b)=>a.season-b.season||a.round-b.round||a.originTeam.localeCompare(b.originTeam));
}

export function tierFromPercentile(pct){
  if(pct>=90)return "Tier 1";
  if(pct>=75)return "Tier 2";
  if(pct>=50)return "Tier 3";
  return "Tier 4";
}

export function tierClass(tier){return `tier-${String(tier||"4").replace(/\D/g,"")||4}`}

export function teamTierLabel(pct){
  if(pct>=80)return "Top Tier";
  if(pct>=60)return "Above Average";
  if(pct>=40)return "Middle Tier";
  if(pct>=20)return "Below Average";
  return "Bottom Tier";
}

export function ordinal(n){
  const v=n%100;return `${n}${["th","st","nd","rd"][(v-20)%10]||["th","st","nd","rd"][v]||"th"}`;
}

export function assignPlayerPositionTiers(players){
  // A positional percentile becomes an easy-to-read tier, avoiding QB-vs-WR
  // comparisons that would not be meaningful in fantasy lineup decisions.
  const groups=new Map();
  for(const p of players){
    const pos=p.position||"Other";
    if(!groups.has(pos))groups.set(pos,[]);
    groups.get(pos).push(p);
  }
  for(const group of groups.values()){
    group.sort((a,b)=>num(b.expectedPpg)-num(a.expectedPpg)||num(b.dynastyValue)-num(a.dynastyValue));
    const total=group.length;
    group.forEach((p,i)=>{
      const pct=total<=1?100:100*(1-i/(total-1));
      p.positionRank=i+1;
      p.positionPoolSize=total;
      p.positionPercentile=pct;
      p.positionTier=tierFromPercentile(pct);
    });
  }
}

export function syncTeamPlayerReferences(analysis){
  // Reconnect copied team lineup records to their canonical player records after
  // a saved report is loaded, so later view-only calculations stay consistent.
  const playerMap=new Map((analysis.players||[]).map(p=>[String(p.sleeperId),p]));
  for(const team of analysis.teams||[]){
    team.players=(analysis.players||[]).filter(p=>p.rosterId===team.rosterId);
    for(const entry of team.lineup||[]){
      const current=playerMap.get(String(entry.player?.sleeperId));
      if(current)entry.player=current;
    }
    team.bench=(team.bench||[]).map(p=>playerMap.get(String(p.sleeperId))||p);
  }
}
