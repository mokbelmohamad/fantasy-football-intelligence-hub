// Small shared helpers. Short names ($ and $$) are intentionally used only for
// DOM lookups; the rest convert, format, or safely display external data.
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

// Escapes text before it is inserted into HTML, preventing player/team names
// received from an API from being treated as page markup.
export function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}

// Converts a value to a usable number; f is the safe fallback (zero by default).
export function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}

// Similar to num, but preserves "unknown" as null instead of quietly using zero.
export function nullable(v){if(v===null||v===undefined||v===""||v==="NA")return null;const n=Number(v);return Number.isFinite(n)?n:null}

export function fmt(v,d=1){return v===null||v===undefined||Number.isNaN(Number(v))?"—":Number(v).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d})}

export function intFmt(v){return v===null||v===undefined?"—":Math.round(Number(v)).toLocaleString("en-US")}

export function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

export function todayKey(){return new Date().toISOString().slice(0,10)}

// Makes names comparable across data providers (for example, "D.J. Moore"
// and "DJ Moore Jr.") when their numeric IDs do not match.
export function normName(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\b(jr|sr|ii|iii|iv)\b/g,"").replace(/[^a-z0-9]/g,"")}

export function sum(arr,fn=x=>x){return arr.reduce((a,x)=>a+num(fn(x)),0)}

export function mean(arr){return arr.length?sum(arr)/arr.length:0}

// Creates a temporary browser download. b is the file contents and a is a
// temporary hidden link that starts the browser's normal download flow.
export function download(name,text,type){const b=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}

export function csvEscape(v){if(v===null||v===undefined)return "";const s=Array.isArray(v)?v.join("; "):String(v);return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}

export function log(msg,pct){$("#status").textContent=msg;if(pct!==undefined)$("#progressBar").style.width=`${clamp(pct,0,100)}%`}

export function sourceBadge(name,status,detail=""){return `<span class="badge ${status}">${status==="ok"?"●":status==="warn"?"▲":"●"} ${esc(name)}${detail?`: ${esc(detail)}`:""}</span>`}

export function setSources(sources){$("#sourceStatus").innerHTML=sources.map(s=>sourceBadge(s.name,s.status,s.detail)).join("")}
