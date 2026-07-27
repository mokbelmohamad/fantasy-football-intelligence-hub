export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

export function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}

export function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}

export function nullable(v){if(v===null||v===undefined||v===""||v==="NA")return null;const n=Number(v);return Number.isFinite(n)?n:null}

export function fmt(v,d=1){return v===null||v===undefined||Number.isNaN(Number(v))?"—":Number(v).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d})}

export function intFmt(v){return v===null||v===undefined?"—":Math.round(Number(v)).toLocaleString("en-US")}

export function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

export function todayKey(){return new Date().toISOString().slice(0,10)}

export function normName(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\b(jr|sr|ii|iii|iv)\b/g,"").replace(/[^a-z0-9]/g,"")}

export function sum(arr,fn=x=>x){return arr.reduce((a,x)=>a+num(fn(x)),0)}

export function mean(arr){return arr.length?sum(arr)/arr.length:0}

export function download(name,text,type){const b=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}

export function csvEscape(v){if(v===null||v===undefined)return "";const s=Array.isArray(v)?v.join("; "):String(v);return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}

export function log(msg,pct){$("#status").textContent=msg;if(pct!==undefined)$("#progressBar").style.width=`${clamp(pct,0,100)}%`}

export function sourceBadge(name,status,detail=""){return `<span class="badge ${status}">${status==="ok"?"●":status==="warn"?"▲":"●"} ${esc(name)}${detail?`: ${esc(detail)}`:""}</span>`}

export function setSources(sources){$("#sourceStatus").innerHTML=sources.map(s=>sourceBadge(s.name,s.status,s.detail)).join("")}
