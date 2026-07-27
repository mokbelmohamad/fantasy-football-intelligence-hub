"use strict";

import { analyze } from "./analyze.js";
import { reportError, userMessage } from "./errors.js";
import { state } from "./state.js";
import { idbDelete, idbGet } from "./storage.js";
import {
  $,
  $$,
  download,
  log,
} from "./utils.js";
import { prepareAnalysisForRender } from "./tiers.js";
import {
  csvFrom,
  drawRankChart,
  populateTeamSelectors,
  renderAll,
  setSelectedTeam,
  showDashboardShell,
  showLanding,
  switchTab,
} from "./render.js";

$("#analyzeBtn").onclick=()=>analyze(false);
$("#refreshBtn").onclick=()=>analyze(true);
$("#globalUpdateBtn").onclick=()=>setSelectedTeam($("#globalTeamSelect").value);
$("#appRefreshBtn").onclick=()=>analyze(true);
$("#changeLeagueBtn").onclick=showLanding;
$("#leagueId").addEventListener("keydown",e=>{if(e.key==="Enter")analyze(false)});
$("#loadSavedBtn").onclick=async()=>{const id=$("#leagueId").value.trim(),a=await idbGet(`analysis:${id}`);if(!a){log("No saved report was found for this league ID.");return}state.analysis=prepareAnalysisForRender(a);populateTeamSelectors();renderAll();showDashboardShell();log(`Loaded saved report generated ${new Date(a.generatedAt).toLocaleString()}.`,100)};
$("#clearBtn").onclick=async()=>{const id=$("#leagueId").value.trim();await idbDelete(`analysis:${id}`);state.analysis=null;$$(".view").forEach(v=>v.innerHTML="");showLanding();log("Cached report cleared.",0)};
$("#tabs").onclick=e=>{const b=e.target.closest(".tab");if(b)switchTab(b.dataset.view)};
$("#jsonExport").onclick=()=>download(`sleeper_${state.analysis.leagueId}_analysis.json`,JSON.stringify(state.analysis,null,2),"application/json");
$("#rankingCsv").onclick=()=>{
  const c=[{key:"currentRank",label:"Rank"},{key:"team",label:"Team"},{key:"currentClass",label:"Classification"},{key:"lineupPpg",label:"Expected PPG"},{key:"depth",label:"Depth"},{key:"totalValue",label:"Dynasty Value"},{key:"risk",label:"Risk"},{key:"futureFirsts",label:"Future Firsts"},{key:"contenderScore",label:"Contender Score"},{key:"franchiseRank",label:"Franchise Rank"}];
  download(`sleeper_${state.analysis.leagueId}_rankings.csv`,csvFrom(state.analysis.teams,c),"text/csv;charset=utf-8");
};
$("#playerCsv").onclick=()=>{
  const c=["fantasyTeam","manager","name","position","nflTeam","age","rosterStatus","actualPoints","actualPpg","expectedPpg","projectedTotal","dynastyValueRA","dynastyValueDP","dynastyValue","riskTier","riskScore","injuryStatus","projectionSource","sleeperId"].map(k=>({key:k,label:k}));
  download(`sleeper_${state.analysis.leagueId}_players.csv`,csvFrom(state.analysis.players,c),"text/csv;charset=utf-8");
};
$("#snapshotExport").onclick=()=>{
  const clone=document.documentElement.cloneNode(true),node=clone.querySelector("#embedded-analysis");node.textContent=JSON.stringify(state.analysis).replace(/<\/script/gi,"<\\/script");
  download(`sleeper_${state.analysis.leagueId}_report.html`,"<!DOCTYPE html>\n"+clone.outerHTML,"text/html;charset=utf-8");
};
$("#printBtn").onclick=()=>window.print();
window.addEventListener("resize",()=>{if($("#dashboard").classList.contains("active"))drawRankChart()});

document.addEventListener("click",e=>{
  const th=e.target.closest("th[data-key]");if(!th)return;
  const table=th.closest("table"),key=th.dataset.key,tbody=table.querySelector("tbody"),rows=[...tbody.rows],idx=[...th.parentElement.cells].indexOf(th);
  const k=`${table.dataset.table}:${key}`,asc=state.sort[k]!==true;state.sort[k]=asc;
  rows.sort((a,b)=>{const av=a.cells[idx].textContent.trim().replace(/[$,%+]/g,"").replace(/,/g,""),bv=b.cells[idx].textContent.trim().replace(/[$,%+]/g,"").replace(/,/g,"");const an=Number(av),bn=Number(bv);const cmp=Number.isFinite(an)&&Number.isFinite(bn)?an-bn:av.localeCompare(bv);return asc?cmp:-cmp});
  rows.forEach(r=>tbody.appendChild(r));
});

(async function init(){
  const embedded=$("#embedded-analysis").textContent.trim();
  if(embedded){try{state.analysis=prepareAnalysisForRender(JSON.parse(embedded));$("#leagueId").value=state.analysis.leagueId;populateTeamSelectors();renderAll();showDashboardShell();log(`Loaded embedded report generated ${new Date(state.analysis.generatedAt).toLocaleString()}.`,100)}catch(e){console.error(e)}}
})();


window.addEventListener("unhandledrejection", (event) => {
  const error = reportError(event.reason, { source: "Unhandled promise" });
  log(userMessage(error));
});

window.addEventListener("error", (event) => {
  if (!event.error) {
    return;
  }

  const error = reportError(event.error, { source: "Browser runtime" });
  log(userMessage(error));
});
