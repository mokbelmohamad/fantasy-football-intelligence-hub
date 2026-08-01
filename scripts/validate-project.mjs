import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// Lightweight release check. root anchors all paths; required lists every
// runtime module and data snapshot that must be present in a release.
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const required=[
  "index.html","js/app.js","js/analyze.js","js/errors.js","js/api/index.js",
  "js/api/http.js","js/api/sleeper.js","js/api/rosterAudit.js",
  "js/api/dynastyProcess.js","js/api/projections.js","js/render.js",
  "js/api/leagueSession.js",
  "js/views/dashboard.js","js/views/teams.js","js/views/lineups.js",
  "js/views/trade.js","js/views/players.js","js/views/tiers.js",
  "js/views/picks.js","js/views/history.js","js/views/methodology.js",
  "js/views/settings.js","data/metadata.json",
  ".github/workflows/update-data.yml"
];
for(const file of required)await access(resolve(root,file));
for(const file of required.filter((item)=>item.endsWith(".js"))){
  const result=spawnSync(process.execPath,["--check",resolve(root,file)],{encoding:"utf8"});
  if(result.status!==0)throw new Error(result.stderr||`Syntax failed: ${file}`);
}
const html=await readFile(resolve(root,"index.html"),"utf8");
if(!/<script type="module" src="\.\/js\/app\.js(?:\?[^\"]+)?"><\/script>/.test(html)){
  throw new Error("index.html is missing the module app.js script.");
}
for(const file of ["players.json","projections.json","dynasty-values.json","roster-audit-projections.json","pick-values.json","dynasty-process.json","metadata.json"]){
  JSON.parse(await readFile(resolve(root,"data",file),"utf8"));
}
console.log("Project validation passed.");
