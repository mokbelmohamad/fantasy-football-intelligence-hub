import { API } from "./config.js";
import { idbGet, idbSet } from "./storage.js";
import { todayKey } from "./utils.js";

export async function fetchWithTimeout(url,opts={},timeout=45000){
  const controller=new AbortController();const t=setTimeout(()=>controller.abort(),timeout);
  try{const r=await fetch(url,{...opts,signal:controller.signal,cache:"no-store"});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r}
  finally{clearTimeout(t)}
}

export async function fetchJson(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).json()}

export async function fetchText(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).text()}

export async function allSettledMap(items,worker,concurrency=6){
  const out=new Array(items.length);let cursor=0;
  async function run(){while(cursor<items.length){const i=cursor++;try{out[i]={status:"fulfilled",value:await worker(items[i],i)}}catch(e){out[i]={status:"rejected",reason:e}}}}
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},run));return out
}

export function parseCSV(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){cell+='"';i++}
    else if(c==='"')quoted=!quoted;
    else if(c===","&&!quoted){row.push(cell);cell=""}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);cell="";if(row.some(v=>v!==""))rows.push(row);row=[]}
    else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);rows.push(row)}
  if(!rows.length)return [];
  const h=rows[0].map(x=>x.trim());
  return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??""])));
}

export function collectProjectionPlayers(node,out=new Map()){
  if(!node||typeof node!=="object")return out;
  if(!Array.isArray(node)&&node.sleeper_id&&(node.ppg_ppr!==undefined||node.ppg!==undefined))out.set(String(node.sleeper_id),node);
  if(Array.isArray(node))node.forEach(x=>collectProjectionPlayers(x,out));else Object.values(node).forEach(x=>collectProjectionPlayers(x,out));
  return out;
}

export function flattenProjectionResponse(j){if(Array.isArray(j))return j;if(Array.isArray(j?.data))return j.data;if(Array.isArray(j?.projections))return j.projections;return []}

export function projectionId(row){return String(row?.player_id??row?.player?.player_id??row?.player?.id??"")}

export function field(o,names){for(const n of names)if(o&&o[n]!==undefined&&o[n]!==null&&o[n]!=="")return o[n];return null}

export async function loadPlayerDirectory(force,sources){
  const key=`players:${todayKey()}`;
  if(!force){const cached=await idbGet(key);if(cached){sources.push({name:"Sleeper players",status:"ok",detail:"daily cache"});return cached}}
  const players=await fetchJson(`${API.sleeper}/players/nfl`,90000);
  await idbSet(key,players);sources.push({name:"Sleeper players",status:"ok",detail:"live"});return players;
}

export async function loadSleeperProjections(season,sources){
  const full=`${API.projections}/${season}?season_type=regular&order_by=pts_ppr`;
  let rows=[];
  try{rows=flattenProjectionResponse(await fetchJson(full,50000))}catch{}
  if(!rows.length){
    const positions=["QB","RB","WR","TE","K","DEF","DL","LB","DB"];
    const results=await allSettledMap(positions,async p=>{
      const urls=[
        `${API.projections}/${season}?season_type=regular&position=${p}&order_by=pts_ppr`,
        `${API.projections}/${season}?season_type=regular&position[]=${p}&order_by=pts_ppr`
      ];
      for(const u of urls){try{const x=flattenProjectionResponse(await fetchJson(u,30000));if(x.length)return x}catch{}}
      return [];
    },4);
    rows=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
  }
  const map=new Map();rows.forEach(r=>{const id=projectionId(r);if(id)map.set(id,r)});
  sources.push({name:"Sleeper projections",status:map.size?"ok":"warn",detail:`${map.size} players`});return map;
}

export async function getLeagueBundle(id){
  const [league,users,rosters,tradedPicks,drafts]=await Promise.all([
    fetchJson(`${API.sleeper}/league/${id}`),
    fetchJson(`${API.sleeper}/league/${id}/users`),
    fetchJson(`${API.sleeper}/league/${id}/rosters`),
    fetchJson(`${API.sleeper}/league/${id}/traded_picks`).catch(()=>[]),
    fetchJson(`${API.sleeper}/league/${id}/drafts`).catch(()=>[])
  ]);
  return {league,users,rosters,tradedPicks,drafts};
}

export async function getHistory(currentBundle,depth){
  const history=[currentBundle];let id=currentBundle.league.previous_league_id;
  while(id&&id!=="0"&&history.length<=depth){
    try{const b=await getLeagueBundle(id);history.push(b);id=b.league.previous_league_id}catch{break}
  }
  return history;
}

export async function getMatchups(leagueId,maxWeek){
  if(maxWeek<1)return {};
  const weeks=Array.from({length:maxWeek},(_,i)=>i+1);
  const results=await allSettledMap(weeks,w=>fetchJson(`${API.sleeper}/league/${leagueId}/matchups/${w}`),6);
  const out={};results.forEach((r,i)=>{if(r.status==="fulfilled"&&Array.isArray(r.value)&&r.value.length)out[weeks[i]]=r.value});return out;
}
