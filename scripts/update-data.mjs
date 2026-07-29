import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Offline data refresh script. root is the project directory; dataDirectory is
// where browser-readable fallback snapshots are written.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = resolve(root, "data");
const endpoints = {
  sleeper: "https://api.sleeper.app/v1",
  projections: "https://api.sleeper.com/projections/nfl",
  rosterAuditValues: "https://rosteraudit.com/wp-json/ra/v1/rankings/values",
  rosterAuditProjections: "https://rosteraudit.com/wp-json/ra/v1/projections/ppg-rankings",
  rosterAuditPicks: "https://rosteraudit.com/wp-json/ra/v1/picks",
  dynastyProcessIds: "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv",
  dynastyProcessValues: "https://raw.githubusercontent.com/dynastyprocess/data/master/files/values.csv",
};
const formatKeys = ["1qb_ppr","1qb_half","sf_ppr","sf_half","sf_ppr_tep"];

async function fetchResponse(url, timeout = 90000) {
  // AbortController stops a single unavailable source from blocking an update.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: {"user-agent":"Fantasy-Football-Intelligence-Hub/2.0"},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}
const fetchJson = async (url, timeout) => (await fetchResponse(url, timeout)).json();
const fetchText = async (url, timeout) => (await fetchResponse(url, timeout)).text();

function parseCsv(text) {
  // Minimal CSV parser that preserves quoted commas in player names.
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i+=1){
    const c=text[i],n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){cell+='"';i+=1}
    else if(c==='"')quoted=!quoted;
    else if(c===","&&!quoted){row.push(cell);cell=""}
    else if((c==="\n"||c==="\r")&&!quoted){
      if(c==="\r"&&n==="\n")i+=1;
      row.push(cell);cell="";
      if(row.some((value)=>value!==""))rows.push(row);
      row=[];
    }else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);rows.push(row)}
  if(!rows.length)return [];
  const headers=rows[0].map((value)=>value.trim());
  return rows.slice(1).map((values)=>Object.fromEntries(
    headers.map((header,index)=>[header,values[index]??""])
  ));
}

async function writeJson(filename,payload){
  const path=resolve(dataDirectory,filename);
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,`${JSON.stringify(payload,null,2)}\n`,"utf8");
}
async function readExisting(filename,fallback){
  try{return JSON.parse(await readFile(resolve(dataDirectory,filename),"utf8"))}
  catch{return fallback}
}
async function safeUpdate(name,filename,worker,fallback){
  // Keep the last good file when a download fails. worker gets new data; the
  // fallback describes the safe empty data shape for a first-time run.
  try{
    const payload=await worker();
    await writeJson(filename,payload);
    console.log(`Updated ${name}`);
    return {ok:true};
  }catch(error){
    console.error(`Failed to update ${name}: ${error.message}`);
    await writeJson(filename,await readExisting(filename,fallback));
    return {ok:false,error:error.message};
  }
}

const generatedAt=new Date().toISOString();
const nflState=await fetchJson(`${endpoints.sleeper}/state/nfl`);
const season=Number(nflState.season);
const sources={};

sources.players=await safeUpdate("Sleeper players","players.json",async()=>({
  generatedAt,players:await fetchJson(`${endpoints.sleeper}/players/nfl`,120000)
}),{generatedAt:null,players:{}});

sources.projections=await safeUpdate("Sleeper projections","projections.json",async()=>{
  const response=await fetchJson(`${endpoints.projections}/${season}?season_type=regular&order_by=pts_ppr`,120000);
  const players=Array.isArray(response)?response:response?.data||response?.projections||[];
  if(!players.length)throw new Error("Projection endpoint returned no players.");
  return {generatedAt,season,players};
},{generatedAt:null,season:null,players:[]});

sources.dynastyValues=await safeUpdate("RosterAudit values","dynasty-values.json",async()=>{
  const formats={};
  for(const formatKey of formatKeys){
    formats[formatKey]=await fetchJson(`${endpoints.rosterAuditValues}?format_key=${encodeURIComponent(formatKey)}`);
  }
  return {generatedAt,formats};
},{generatedAt:null,formats:{}});

sources.rosterAuditProjections=await safeUpdate("RosterAudit projections","roster-audit-projections.json",async()=>({
  generatedAt,data:await fetchJson(endpoints.rosterAuditProjections)
}),{generatedAt:null,data:{}});

sources.pickValues=await safeUpdate("RosterAudit picks","pick-values.json",async()=>({
  generatedAt,data:await fetchJson(endpoints.rosterAuditPicks)
}),{generatedAt:null,data:{}});

sources.dynastyProcess=await safeUpdate("DynastyProcess","dynasty-process.json",async()=>{
  const [idsText,valuesText]=await Promise.all([
    fetchText(endpoints.dynastyProcessIds),
    fetchText(endpoints.dynastyProcessValues),
  ]);
  return {generatedAt,ids:parseCsv(idsText),values:parseCsv(valuesText)};
},{generatedAt:null,ids:[],values:[]});

await writeJson("metadata.json",{generatedAt,season,nflState,sources});
if(Object.values(sources).every((source)=>!source.ok))process.exitCode=1;
