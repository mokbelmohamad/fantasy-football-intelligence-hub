import { clamp, fmt, intFmt, num, nullable } from "./utils.js";
import {
  assignPlayerPositionTiers,
  ordinal,
  percentile,
  syncTeamPlayerReferences,
  teamTierLabel,
} from "./league.js";

export function longevityScoreForPlayer(p){
  const age=nullable(p.age),pos=p.position;if(age===null)return 50;
  const peak={QB:[24,32,38],RB:[21,25,30],WR:[22,27,33],TE:[23,29,34]}[pos]||[22,28,34];
  const [start,peakAge,end]=peak;let score;
  if(age<=start)score=92;else if(age<=peakAge)score=100-((age-start)/(peakAge-start))*12;else if(age<=end)score=88-((age-peakAge)/(end-peakAge))*58;else score=Math.max(5,30-(age-end)*10);
  score-=num(p.riskScore)*.18;if(!p.nflTeam||p.nflTeam==='FA')score-=18;return clamp(score,0,100);
}

export function percentileWithinPosition(players,player,key,high=true){const group=players.filter(p=>p.position===player.position);return percentile(group.map(p=>num(p[key])),num(player[key]),high)}

export function buildPlayerTierModel(players){
  const eligiblePlayers=players.filter(p=>{const activeStatus=String(p.status||'').toLowerCase();const relevantStatus=!['retired','inactive'].includes(activeStatus);const hasSignal=num(p.expectedPpg)>0||num(p.dynastyValue)>0||num(p.projectedTotal)>0;return relevantStatus&&hasSignal&&['QB','RB','WR','TE'].includes(p.position)});
  for(const p of eligiblePlayers){p.longevityScore=longevityScoreForPlayer(p);p.projectionPct=percentileWithinPosition(eligiblePlayers,p,'expectedPpg',true);p.valuePct=percentileWithinPosition(eligiblePlayers,p,'dynastyValue',true);p.longevityPct=percentileWithinPosition(eligiblePlayers,p,'longevityScore',true);p.tierComposite=.60*p.projectionPct+.25*p.valuePct+.15*p.longevityPct;if(p.tierComposite>=92)p.analysisTier='S';else if(p.tierComposite>=80)p.analysisTier='1';else if(p.tierComposite>=65)p.analysisTier='2';else if(p.tierComposite>=45)p.analysisTier='3';else p.analysisTier='4'}
  return eligiblePlayers.sort((a,b)=>b.tierComposite-a.tierComposite||b.expectedPpg-a.expectedPpg)
}

export function tierLabel(tier){return ({S:'Elite Cornerstones','1':'High-End Starters','2':'Strong Starters / Core Assets','3':'Useful Starters / Depth','4':'Speculative / Replacement Level'})[tier]||tier}

export function tierDescription(tier){return ({S:'Top projection, elite market value, and strong longevity profile.','1':'High weekly projection with strong dynasty support and manageable longevity risk.','2':'Reliable projected contributors with solid market value or career runway.','3':'Useful but limited by projection, market value, or longevity.','4':'Low projection, weak market support, or significant career/role risk.'})[tier]||''}

export function positionalEvidence(team,pos,allTeams){
  const score=num(team.positionScores?.[pos]);
  const ranked=[...allTeams].filter(t=>num(t.positionScores?.[pos])>0)
    .sort((a,b)=>num(b.positionScores?.[pos])-num(a.positionScores?.[pos]));
  const rank=Math.max(1,ranked.findIndex(t=>t.rosterId===team.rosterId)+1);
  const pct=percentile(ranked.map(t=>num(t.positionScores?.[pos])),score);
  const players=(team.lineup||[]).filter(x=>x.player.position===pos)
    .map(x=>x.player).sort((a,b)=>num(b.expectedPpg)-num(a.expectedPpg));
  const detail=players.length?players.map(p=>
    `${p.name} — ${p.position}${p.positionRank||"?"}/${p.positionPoolSize||"?"}, ${p.positionTier||"Unrated"}, ${fmt(p.expectedPpg,2)} expected PPG, ${intFmt(p.dynastyValue)} value`
  ).join(" · "):"No projected starter at this position.";
  return {rank,pct,score,players,detail,label:teamTierLabel(pct)};
}

export function prepareAnalysisForRender(analysis){
  if(!analysis)return analysis;
  assignPlayerPositionTiers(analysis.players||[]);
  analysis.tierPlayers=buildPlayerTierModel(analysis.players||[]);
  syncTeamPlayerReferences(analysis);
  for(const team of analysis.teams||[])team.insights=buildTeamInsights(team,analysis.teams);
  return analysis;
}

export function buildTeamInsights(team,allTeams){
  const strengths=[],weaknesses=[];
  for(const pos of ["QB","RB","WR","TE"]){
    if(!num(team.positionScores?.[pos]))continue;
    const ev=positionalEvidence(team,pos,allTeams);
    const item={
      title:`${pos} ranks ${ordinal(ev.rank)} of ${allTeams.length} — ${ev.label}`,
      detail:`Combined projected starter output: ${fmt(ev.score,2)} expected PPG. ${ev.detail}`
    };
    if(ev.pct>=65)strengths.push(item);
    if(ev.pct<=35)weaknesses.push(item);
  }

  const depthRank=[...allTeams].sort((a,b)=>b.depth-a.depth).findIndex(t=>t.rosterId===team.rosterId)+1;
  const topBench=[...(team.bench||[])].sort((a,b)=>b.expectedPpg-a.expectedPpg).slice(0,5);
  const depthDetail=topBench.length
    ?topBench.map(p=>`${p.name} (${p.position}, ${fmt(p.expectedPpg,2)} PPG, ${p.positionTier||"Unrated"})`).join(" · ")
    :"No projected bench contributors.";
  if(team.depthPct>=65)strengths.push({
    title:`Depth ranks ${ordinal(depthRank)} of ${allTeams.length}`,
    detail:`Depth index ${fmt(team.depth,2)}. Top reserves: ${depthDetail}`
  });
  if(team.depthPct<=35)weaknesses.push({
    title:`Depth ranks ${ordinal(depthRank)} of ${allTeams.length}`,
    detail:`Depth index ${fmt(team.depth,2)}. Best available reserves: ${depthDetail}`
  });

  const acquired=(team.picksOwned||[]).filter(p=>p.acquired);
  const ownFirsts=(team.picksOwned||[]).filter(p=>p.round===1);
  const acquiredText=acquired.length
    ?acquired.slice(0,5).map(p=>`${p.season} R${p.round} from ${p.originTeam}`).join(" · ")
    :"No acquired future picks.";
  if(team.picksPct>=65)strengths.push({
    title:`Future capital ranks in the ${teamTierLabel(team.picksPct).toLowerCase()}`,
    detail:`${team.futureFirsts} future firsts, ${team.picksOwned.length} total picks, model capital ${intFmt(team.pickCapital)}. ${acquiredText}`
  });
  if(team.picksPct<=25)weaknesses.push({
    title:"Limited future draft flexibility",
    detail:`${team.futureFirsts} future firsts and ${team.picksOwned.length} total picks, model capital ${intFmt(team.pickCapital)}. ${acquiredText}`
  });

  const highRisk=(team.lineup||[]).filter(x=>x.player.riskScore>=40).sort((a,b)=>b.player.riskScore-a.player.riskScore);
  if(team.riskPct>=65)strengths.push({
    title:"Projected lineup has relatively low risk",
    detail:`Weighted risk score ${fmt(team.risk,1)}. High-risk projected starters: ${highRisk.length?highRisk.map(x=>`${x.player.name} (${x.player.riskTier}, ${x.player.riskScore})`).join(" · "):"none"}.`
  });
  if(team.riskPct<=35)weaknesses.push({
    title:"Projected lineup carries elevated availability or age risk",
    detail:`Weighted risk score ${fmt(team.risk,1)}. Main risks: ${highRisk.length?highRisk.map(x=>`${x.player.name} (${x.player.riskTier}, ${x.player.riskScore}: ${(x.player.reasons||[]).join(", ")})`).join(" · "):"risk is spread across the lineup"}.`
  });

  const young=team.players.filter(p=>p.age!==null&&p.age<27&&["RB","WR","TE"].includes(p.position))
    .sort((a,b)=>b.dynastyValue-a.dynastyValue).slice(0,5);
  if(team.youngPct>=65)strengths.push({
    title:"Strong young skill-position foundation",
    detail:`Young skill value ${intFmt(team.youngValue)}. Leaders: ${young.map(p=>`${p.name} (${p.position}, age ${p.age}, ${intFmt(p.dynastyValue)} value, ${p.positionTier})`).join(" · ")}`
  });

  if(!strengths.length)strengths.push({
    title:"Balanced roster profile",
    detail:`Expected lineup ${fmt(team.lineupPpg,2)} PPG, depth ${fmt(team.depth,2)}, dynasty value ${intFmt(team.totalValue)}, and weighted risk ${fmt(team.risk,1)}. No component reaches the top-third threshold.`
  });
  if(!weaknesses.length)weaknesses.push({
    title:"No severe bottom-tier weakness detected",
    detail:`The lowest team component remains above the bottom-third threshold. Review the final flex spots and high-risk starters for the most practical upgrade path.`
  });

  let strategy;
  if(team.currentRank<=Math.ceil(allTeams.length/3)){
    strategy=team.depthPct<40?"Contend, but prioritize depth before paying for another star.":"Contend and selectively buy meaningful weekly upgrades.";
  }else if(team.currentRank<=Math.ceil(allTeams.length*.6)){
    strategy=team.franchiseRank<=Math.ceil(allTeams.length/2)?"Stay flexible; buy only when the upgrade preserves the young core.":"Retool rather than fully rebuild; move aging value for younger production.";
  }else{
    strategy=team.franchiseRank<=Math.ceil(allTeams.length/2)?"Patient rebuild: hold the young core and avoid expensive veterans.":"Sell aging production and accumulate picks or young cornerstone assets.";
  }

  const leader=allTeams[0];
  const strategyEvidence=
    `Current rank ${team.currentRank} of ${allTeams.length}; ${fmt(team.lineupPpg,2)} expected PPG `+
    `(${fmt(leader.lineupPpg-team.lineupPpg,2)} behind the leader); dynasty rank ${team.franchiseRank}; `+
    `depth rank ${depthRank}; ${team.futureFirsts} future firsts; ${team.highRiskStarters} high-risk projected starters.`;

  const build=team.players.filter(p=>["RB","WR","TE","QB"].includes(p.position)&&num(p.age)<27&&num(p.dynastyValue)>1000)
    .sort((a,b)=>b.dynastyValue-a.dynastyValue).slice(0,4);
  const shop=team.players.filter(p=>(
    (p.position==="RB"&&num(p.age)>=27)||
    (p.position==="WR"&&num(p.age)>=29)||
    (p.position==="TE"&&num(p.age)>=30)||
    (p.position==="QB"&&num(p.age)>=34)
  )&&num(p.dynastyValue)>100).sort((a,b)=>b.dynastyValue-a.dynastyValue).slice(0,4);

  return {
    strengths:strengths.slice(0,5),
    weaknesses:weaknesses.slice(0,5),
    strategy,strategyEvidence,build,shop
  };
}
