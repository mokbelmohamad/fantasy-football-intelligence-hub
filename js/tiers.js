// Player-tier and team-insight calculations, separated from loading data so the
// scoring rules are visible and consistently reusable.
import { clamp, fmt, intFmt, num, nullable } from "./utils.js";
import {
  assignPlayerPositionTiers,
  ordinal,
  percentile,
  syncTeamPlayerReferences,
  teamTierLabel,
} from "./league.js";

export function longevityScoreForPlayer(p){
  // Estimates career runway by position-specific age curve, then discounts risk.
  const age=nullable(p.age),pos=p.position;if(age===null)return 50;
  const peak={QB:[24,32,38],RB:[21,25,30],WR:[22,27,33],TE:[23,29,34]}[pos]||[22,28,34];
  const [start,peakAge,end]=peak;let score;
  if(age<=start)score=92;else if(age<=peakAge)score=100-((age-start)/(peakAge-start))*12;else if(age<=end)score=88-((age-peakAge)/(end-peakAge))*58;else score=Math.max(5,30-(age-end)*10);
  score-=num(p.riskScore)*.18;if(!p.nflTeam||p.nflTeam==='FA')score-=18;return clamp(score,0,100);
}

// group is the player's position peer group; key is the metric being compared.
export function percentileWithinPosition(players,player,key,high=true){const group=players.filter(p=>p.position===player.position);return percentile(group.map(p=>num(p[key])),num(player[key]),high)}

export function buildPlayerTierModel(players){
  // Compare players only with others at the same position. The returned list
  // contains the calculated percentile and tier fields needed by the tier view.
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
  // Backfills display-only fields so current and older saved reports render alike.
  if(!analysis)return analysis;
  assignPlayerPositionTiers(analysis.players||[]);
  analysis.tierPlayers=buildPlayerTierModel(analysis.players||[]);
  syncTeamPlayerReferences(analysis);
  for(const team of analysis.teams||[])team.insights=buildTeamInsights(team,analysis.teams);
  return analysis;
}

function statusFromRank(rank,total){
  const pct=rank/Math.max(total,1);
  if(pct<=.10)return "Elite";
  if(pct<=.25)return "Strong";
  if(pct<=.42)return "Above Average";
  if(pct<=.60)return "Average";
  if(pct<=.78)return "Below Average";
  return "Weak";
}

function positionPlayers(team,pos){
  if(pos==="FLEX")return (team.lineup||[]).filter(x=>String(x.slot||"").includes("FLEX")&&x.slot!=="SUPER_FLEX").map(x=>x.player);
  return (team.lineup||[]).filter(x=>x.player.position===pos&&!String(x.slot||"").includes("FLEX")).map(x=>x.player);
}

function positionReview(team,allTeams,pos,label=pos){
  const total=allTeams.length,rank=team.positionRanks?.[pos]||total;
  const score=num(team.positionScores?.[pos]);
  const leagueAverage=allTeams.length?allTeams.reduce((sum,t)=>sum+num(t.positionScores?.[pos]),0)/allTeams.length:0;
  const players=positionPlayers(team,pos).sort((a,b)=>num(b.expectedPpg)-num(a.expectedPpg));
  const bench=(team.bench||[]).filter(p=>pos==="FLEX"?["RB","WR","TE"].includes(p.position):p.position===pos).sort((a,b)=>num(b.expectedPpg)-num(a.expectedPpg));
  const avgAge=players.filter(p=>nullable(p.age)!==null).length?players.filter(p=>nullable(p.age)!==null).reduce((sum,p)=>sum+num(p.age),0)/players.filter(p=>nullable(p.age)!==null).length:null;
  const risk=players.length?players.reduce((sum,p)=>sum+num(p.riskScore),0)/players.length:0;
  const status=statusFromRank(rank,total);
  const gap=score-leagueAverage;
  let action="Hold";
  if(rank>Math.ceil(total*.75))action="Targeted upgrade";
  else if(rank>Math.ceil(total*.58))action="Monitor and add depth";
  else if(rank<=Math.max(2,Math.floor(total*.2)))action="Preserve advantage";
  const playerNames=players.length?players.slice(0,3).map(p=>p.name).join(", "):"no locked-in starter";
  let summary=`${label} ranks ${ordinal(rank)} of ${total} in projected starter output. `;
  if(gap>=1)summary+=`The group sits ${fmt(gap,2)} PPG above the league average and is led by ${playerNames}. `;
  else if(gap<=-1)summary+=`The group trails the league average by ${fmt(Math.abs(gap),2)} PPG, making it a practical area to improve. `;
  else summary+=`The group is close to the league average and is led by ${playerNames}. `;
  if(bench[0])summary+=`The best reserve is ${bench[0].name} at ${fmt(bench[0].expectedPpg,2)} expected PPG.`;
  else summary+="There is limited proven depth behind the projected starters.";
  return {key:pos,label,status,action,rank,score,gap,summary,metrics:[
    {label:"Position Rank",value:`${ordinal(rank)} of ${total}`},
    {label:"Starter EPPG",value:fmt(score,2)},
    {label:"Gap to Average",value:`${gap>=0?"+":""}${fmt(gap,2)}`},
    {label:"Top Reserve",value:bench[0]?`${bench[0].name} · ${fmt(bench[0].expectedPpg,2)}`:"None"},
    {label:"Average Starter Age",value:avgAge===null?"N/A":fmt(avgAge,1)},
    {label:"Risk",value:risk>=40?"High":risk>=25?"Moderate":"Low"},
    {label:"Recommended Action",value:action},
  ]};
}

function depthReview(team,allTeams){
  const total=allTeams.length;
  const rank=[...allTeams].sort((a,b)=>num(b.depth)-num(a.depth)).findIndex(t=>t.rosterId===team.rosterId)+1;
  const reserves=[...(team.bench||[])].sort((a,b)=>num(b.expectedPpg)-num(a.expectedPpg)).slice(0,5);
  const status=statusFromRank(rank,total);
  const action=rank>Math.ceil(total*.7)?"Add playable depth":rank<=Math.ceil(total*.25)?"Preserve depth":"Monitor waivers";
  return {key:"DEPTH",label:"Bench Depth",status,action,summary:`Bench depth ranks ${ordinal(rank)} of ${total}. ${reserves.length?`The leading reserves are ${reserves.slice(0,3).map(p=>p.name).join(", ")}.`:"The roster has limited projected bench production."}`,metrics:[
    {label:"Depth Rank",value:`${ordinal(rank)} of ${total}`},
    {label:"Depth Index",value:fmt(team.depth,2)},
    {label:"Top Reserves",value:reserves.length?reserves.slice(0,3).map(p=>p.name).join(", "):"None"},
    {label:"High-Risk Starters",value:String(team.highRiskStarters||0)},
    {label:"Recommended Action",value:action},
  ]};
}

function draftReview(team,allTeams){
  const total=allTeams.length;
  const rank=[...allTeams].sort((a,b)=>num(b.pickCapital)-num(a.pickCapital)).findIndex(t=>t.rosterId===team.rosterId)+1;
  const status=statusFromRank(rank,total);
  const action=rank>Math.ceil(total*.7)?"Protect remaining picks":rank<=Math.ceil(total*.25)?"Use selectively for upgrades":"Maintain flexibility";
  return {key:"PICKS",label:"Draft Capital",status,action,summary:`Future draft capital ranks ${ordinal(rank)} of ${total}. The team controls ${team.futureFirsts||0} future first-round picks and ${team.picksOwned?.length||0} total modeled picks.`,metrics:[
    {label:"Capital Rank",value:`${ordinal(rank)} of ${total}`},
    {label:"Future Firsts",value:String(team.futureFirsts||0)},
    {label:"Total Picks",value:String(team.picksOwned?.length||0)},
    {label:"Capital Value",value:intFmt(team.pickCapital)},
    {label:"Recommended Action",value:action},
  ]};
}

function championshipOutlook(team,allTeams,reviews,depthRank){
  const total=allTeams.length,leader=allTeams[0],gap=Math.max(0,num(leader.lineupPpg)-num(team.lineupPpg));
  const positionOnly=reviews.filter(r=>["QB","RB","WR","TE","FLEX"].includes(r.key));
  const weakest=[...positionOnly].sort((a,b)=>b.rank-a.rank)[0];
  const strongest=[...positionOnly].sort((a,b)=>a.rank-b.rank)[0];
  const topThird=team.currentRank<=Math.ceil(total/3);
  const bottomThird=team.currentRank>Math.ceil(total*2/3);
  const weakestLabel=weakest?.label||"weakest lineup area";
  const strongestLabel=strongest?.label||"strongest position group";
  let title,explanation,confidence="Medium";
  if(topThird&&weakest&&weakest.rank<=Math.ceil(total*.6)&&gap<=2.5){
    title="Hold the current roster unless a clear value upgrade appears.";
    explanation=`This roster is already positioned for a championship run, ranking ${ordinal(team.currentRank)} of ${total} and sitting only ${fmt(gap,2)} EPPG behind the league leader. The current lineup is close enough to the top that a major trade is more likely to reduce depth or long-term flexibility than to materially change the team's title odds.

The recommendation is to preserve the starting core, premium depth, and future first-round capital while monitoring injuries and role changes. An addition should only be made when it creates a clear starting-lineup improvement without opening a new weakness elsewhere on the roster. Standing pat is an active strategy here because the team already has the production and roster balance required to compete through the full season.`;
    confidence="High";
  }else if(topThird){
    title=`Make one targeted ${weakestLabel} upgrade while preserving the core.`;
    explanation=`This team is a legitimate contender at ${ordinal(team.currentRank)} of ${total}, but the ${weakestLabel} group ranks ${ordinal(weakest?.rank||total)} and represents the clearest obstacle to closing the ${fmt(gap,2)} EPPG gap to the league leader. The rest of the roster is strong enough that a broad overhaul is unnecessary and could weaken areas that already provide a weekly advantage.

The recommendation is to concentrate resources on one meaningful starter-level improvement at ${weakestLabel}. Any acquisition should improve the optimal lineup enough to justify the dynasty cost, while avoiding the unnecessary sale of cornerstone players from ${strongestLabel} or premium future draft capital. The goal is not simply to add another usable player; it is to convert the roster's largest relative weakness into at least a league-average unit without compromising the depth needed for a championship season.`;
    confidence="High";
  }else if(bottomThird){
    title="Prioritize roster value and avoid an expensive win-now move.";
    explanation=`The team ranks ${ordinal(team.currentRank)} of ${total} and trails the league leader by ${fmt(gap,2)} EPPG, which indicates that one short-term acquisition is unlikely to create a true championship roster. Spending premium picks or young cornerstone players on a single veteran would improve one lineup spot while leaving several larger competitive gaps unresolved.

The recommendation is to protect long-term value, build around the roster's strongest foundation in ${strongestLabel}, and improve flexibility across multiple positions before making an aggressive title push. Aging production can be retained when it supports the next competitive window, but it should not prevent the team from gaining younger assets or draft capital when the market offers favorable value. The priority is to create a deeper and more balanced roster that can sustain contention rather than forcing a low-probability run this season.`;
    confidence="High";
  }else{
    title=`Stay flexible and pursue a value-conscious ${weakestLabel} improvement.`;
    explanation=`The roster sits in the middle of the league at ${ordinal(team.currentRank)} of ${total}, close enough to improve but not strong enough to justify an aggressive all-in approach. The ${weakestLabel} group is the clearest place to raise the weekly ceiling, although a marginal upgrade alone may not be enough to move the team into the top contender tier.

The recommendation is to seek an improvement only when the expected lineup gain is meaningful relative to the acquisition cost. The team should preserve its young core and avoid moving premium assets for a small projection increase, while remaining ready to act when another manager offers favorable value. This approach keeps the roster competitive now and protects the flexibility to change direction as player roles, injuries, and league standings develop.`;
  }
  return {title,explanation,metrics:[
    {label:"Contender Rank",value:`${ordinal(team.currentRank)} of ${total}`},
    {label:"Gap to #1",value:`${fmt(gap,2)} EPPG`},
    {label:"Primary Need",value:weakest?.label||"None"},
    {label:"Weakest Rank",value:weakest?`${ordinal(weakest.rank)} of ${total}`:"N/A"},
    {label:"Depth Rank",value:`${ordinal(depthRank)} of ${total}`},
    {label:"Confidence",value:confidence},
  ]};
}

function buildCandidate(player){
  const age=nullable(player.age),position=player.position;
  const maxAge={QB:27,RB:25,WR:26,TE:27}[position];
  return maxAge!==undefined&&age!==null&&age<=maxAge
    &&num(player.expectedPpg)>=6&&num(player.dynastyValue)>=1000
    &&player.rosterStatus!=="Free Agent";
}

function shopCandidate(player){
  const age=nullable(player.age),position=player.position;
  const minAge={QB:33,RB:27,WR:29,TE:30}[position];
  return minAge!==undefined&&age!==null&&age>=minAge
    &&num(player.expectedPpg)>=5&&num(player.dynastyValue)>=500
    &&player.rosterStatus!=="Free Agent";
}

export function buildTeamInsights(team,allTeams){
  const strengths=[],weaknesses=[];
  for(const pos of ["QB","RB","WR","TE"]){
    if(!num(team.positionScores?.[pos]))continue;
    const ev=positionalEvidence(team,pos,allTeams);
    const gap=ev.score-(allTeams.reduce((sum,t)=>sum+num(t.positionScores?.[pos]),0)/Math.max(allTeams.length,1));
    const leaders=ev.players.slice(0,3).map(p=>p.name).join(", ")||"no established starter";
    const direction=gap>=0?`${fmt(gap,2)} PPG above`:`${fmt(Math.abs(gap),2)} PPG below`;
    const item={
      title:`${pos} ranks ${ordinal(ev.rank)} of ${allTeams.length} — ${ev.label}`,
      summary:`The ${pos} group is ${direction} the league average in projected starter output and is led by ${leaders}. ${ev.rank<=Math.ceil(allTeams.length*.35)?"This creates a meaningful weekly advantage that should be preserved when evaluating trades.":"This is a material lineup limitation and should be weighed against the cost of a targeted upgrade."}`,
      metrics:[
        {label:"Position Rank",value:`${ordinal(ev.rank)} of ${allTeams.length}`},
        {label:"Starter EPPG",value:fmt(ev.score,2)},
        {label:"Gap to Average",value:`${gap>=0?"+":""}${fmt(gap,2)}`},
        {label:"Position Status",value:ev.label},
        {label:"Top Contributors",value:leaders},
      ],
      detail:`Combined projected starter output: ${fmt(ev.score,2)} expected PPG. ${ev.detail}`
    };
    if(ev.pct>=65)strengths.push(item);
    if(ev.pct<=35)weaknesses.push(item);
  }
  const depthRank=[...allTeams].sort((a,b)=>b.depth-a.depth).findIndex(t=>t.rosterId===team.rosterId)+1;
  const topBench=[...(team.bench||[])].sort((a,b)=>b.expectedPpg-a.expectedPpg).slice(0,5);
  const depthDetail=topBench.length?topBench.map(p=>`${p.name} (${p.position}, ${fmt(p.expectedPpg,2)} PPG, ${p.positionTier||"Unrated"})`).join(" · "):"No projected bench contributors.";
  const depthInsight={
    title:`Depth ranks ${ordinal(depthRank)} of ${allTeams.length}`,
    summary:team.depthPct>=65
      ?`The bench provides above-average injury protection and lineup flexibility. The strongest reserves are ${topBench.slice(0,3).map(p=>p.name).join(", ")||"not yet established"}, giving the roster alternatives without immediately sacrificing starter quality.`
      :`The bench offers limited protection if a starter misses time or loses a role. The best available reserves are ${topBench.slice(0,3).map(p=>p.name).join(", ")||"not yet established"}, which increases weekly volatility and may justify a low-cost depth addition.`,
    metrics:[
      {label:"Depth Rank",value:`${ordinal(depthRank)} of ${allTeams.length}`},
      {label:"Depth Index",value:fmt(team.depth,2)},
      {label:"Top Reserves",value:topBench.slice(0,3).map(p=>p.name).join(", ")||"None"},
      {label:"High-Risk Starters",value:String(team.highRiskStarters||0)},
    ],
    detail:`Depth index ${fmt(team.depth,2)}. Top reserves: ${depthDetail}`
  };
  if(team.depthPct>=65)strengths.push(depthInsight);
  if(team.depthPct<=35)weaknesses.push(depthInsight);
  if(!strengths.length)strengths.push({
    title:"Balanced roster profile",
    summary:"No single position or roster component creates a dominant advantage, but the team remains competitive across projected lineup output, depth, dynasty value, and risk. The best approach is to preserve balance unless a trade creates a clear net improvement.",
    metrics:[
      {label:"Expected PPG",value:fmt(team.lineupPpg,2)},
      {label:"Depth Index",value:fmt(team.depth,2)},
      {label:"Dynasty Value",value:intFmt(team.totalValue)},
      {label:"Weighted Risk",value:fmt(team.risk,1)},
    ],
    detail:`Expected lineup ${fmt(team.lineupPpg,2)} PPG, depth ${fmt(team.depth,2)}, dynasty value ${intFmt(team.totalValue)}, and weighted risk ${fmt(team.risk,1)}.`
  });
  if(!weaknesses.length){
    const positionRanks=Object.entries(team.positionRanks||{}).filter(([key])=>["QB","RB","WR","TE","FLEX"].includes(key)).sort((a,b)=>b[1]-a[1]);
    const weakest=positionRanks[0];
    weaknesses.push({
      title:"No severe bottom-tier weakness detected",
      summary:`The roster does not have a position in the league's bottom tier. ${weakest?`${weakest[0]} is the lowest-ranked group at ${ordinal(weakest[1])} of ${allTeams.length}, but it is not weak enough to force a trade.`:"The major roster components remain within a competitive range."} A move should only be made when the projected gain clearly exceeds the dynasty cost.`,
      metrics:[
        {label:"Lowest Position",value:weakest?weakest[0]:"N/A"},
        {label:"Lowest Rank",value:weakest?`${ordinal(weakest[1])} of ${allTeams.length}`:"N/A"},
        {label:"Expected PPG",value:fmt(team.lineupPpg,2)},
        {label:"Contender Rank",value:`${ordinal(team.currentRank)} of ${allTeams.length}`},
      ],
      detail:"The lowest team component remains above the bottom-third threshold."
    });
  }

  const positionReviews=[
    positionReview(team,allTeams,"QB","Quarterback"),
    positionReview(team,allTeams,"RB","Running Back"),
    positionReview(team,allTeams,"WR","Wide Receiver"),
    positionReview(team,allTeams,"TE","Tight End"),
    positionReview(team,allTeams,"FLEX","Flex"),
    depthReview(team,allTeams),
    draftReview(team,allTeams),
  ];
  const outlook=championshipOutlook(team,allTeams,positionReviews,depthRank);
  // Build: young, playable, valuable rostered assets. Shop: older, still
  // marketable contributors. A player cannot appear in both lists, even when
  // their current value and age happen to meet both screening thresholds.
  const build=[...(team.players||[])].filter(buildCandidate)
    .sort((a,b)=>num(b.dynastyValue)-num(a.dynastyValue)||num(b.expectedPpg)-num(a.expectedPpg)).slice(0,5);
  const buildIds=new Set(build.map(player=>String(player.sleeperId)));
  const shop=[...(team.players||[])].filter(player=>!buildIds.has(String(player.sleeperId))&&shopCandidate(player))
    .sort((a,b)=>num(b.dynastyValue)-num(a.dynastyValue)||num(b.expectedPpg)-num(a.expectedPpg)).slice(0,5);
  return {
    strengths:strengths.slice(0,5),
    weaknesses:weaknesses.slice(0,5),
    strategy:outlook.title,
    strategyEvidence:outlook.explanation,
    championshipOutlook:outlook,
    positionReviews,
    build,shop
  };
}
