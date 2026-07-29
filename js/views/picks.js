// Draft-pick view. Pick ownership has already incorporated traded-pick records.
import { state } from "../state.js";
import { $, esc, intFmt } from "../utils.js";

export function teamShort(name){
  const words=String(name||"").trim().split(/\s+/);
  if(words.length===1)return words[0].slice(0,10);
  return words.map(w=>w[0]).join("").slice(0,5).toUpperCase();
}

export function pickChip(p,ownerTeam){
  const own=p.originTeam===ownerTeam;
  const label=own?`${p.season} R${p.round} Own`:`${p.season} R${p.round} from ${p.originTeam}`;
  const route=!own&&p.previousOwnerTeam&&p.previousOwnerTeam!==p.originTeam&&p.previousOwnerTeam!==ownerTeam
    ?` · last held by ${p.previousOwnerTeam}`:"";
  return `<span class="pick-chip ${own?"own":"acquired"}" title="${esc(`Original: ${p.originTeam}${route}`)}">${esc(label)}</span>`;
}

export function renderPicks(){
  const a=state.analysis,focus=a.teams.find(t=>t.team===state.selectedTeam)||a.teams[0];
  const maxCapital=Math.max(...a.teams.map(t=>t.pickCapital),1);
  const columns=[...new Set(a.picks.map(p=>`${p.season}|${p.round}`))]
    .map(x=>{const [season,round]=x.split("|").map(Number);return {season,round,key:x}})
    .sort((a,b)=>a.season-b.season||a.round-b.round);

  const cards=[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).map(team=>{
    const owned=[...team.picksOwned].sort((x,y)=>x.season-y.season||x.round-y.round);
    const acquired=owned.filter(p=>p.acquired);
    const sent=a.picks.filter(p=>p.originTeam===team.team&&p.ownerTeam!==team.team);
    return `<div class="capital-card ${team.team===state.selectedTeam?"focused":""}">
      <h3>${esc(team.team)}</h3>
      <div class="capital-meta">Capital rank #${[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).findIndex(x=>x.rosterId===team.rosterId)+1} · model value ${intFmt(team.pickCapital)}</div>
      <div class="mini-stat-row">
        <div class="mini-stat"><div class="n">${team.futureFirsts}</div><div class="l">Future 1sts</div></div>
        <div class="mini-stat"><div class="n">${owned.length}</div><div class="l">Total picks</div></div>
        <div class="mini-stat"><div class="n">${acquired.length}</div><div class="l">Acquired</div></div>
      </div>
      <div class="pick-chip-wrap">${owned.map(p=>pickChip(p,team.team)).join("")||'<span class="small">No future picks tracked.</span>'}</div>
      ${sent.length?`<div class="small" style="margin-top:9px"><strong>Sent away:</strong> ${sent.map(p=>`${p.season} R${p.round} → ${p.ownerTeam}`).join(" · ")}</div>`:""}
    </div>`;
  }).join("");

  const matrixRows=a.teams.map(team=>{
    const cells=columns.map(col=>{
      const owned=a.picks.filter(p=>p.ownerTeam===team.team&&p.season===col.season&&p.round===col.round);
      return `<td>${owned.length?owned.map(p=>{
        const own=p.originTeam===team.team;
        return `<span class="pick-chip ${own?"own":"acquired"}" title="${esc(`Original team: ${p.originTeam}${p.previousOwnerTeam?`; previous owner: ${p.previousOwnerTeam}`:""}`)}">${own?"Own":`From ${teamShort(p.originTeam)}`}</span>`;
      }).join(" "):'<span class="small">—</span>'}</td>`;
    }).join("");
    return `<tr class="${team.team===state.selectedTeam?"focused-row":""}"><td class="matrix-owner">${esc(team.team)}</td>${cells}</tr>`;
  }).join("");

  const acquiredFocus=focus.picksOwned.filter(p=>p.acquired);
  const sentFocus=a.picks.filter(p=>p.originTeam===focus.team&&p.ownerTeam!==focus.team);
  const movementAcquired=acquiredFocus.length?acquiredFocus.map(p=>`<div class="movement-item"><strong>${p.season} Round ${p.round} from ${esc(p.originTeam)}</strong><span class="small">Current owner: ${esc(focus.team)}${p.previousOwnerTeam&&p.previousOwnerTeam!==p.originTeam?` · Previous holder: ${esc(p.previousOwnerTeam)}`:""}</span></div>`).join(""):'<div class="movement-item">No acquired picks.</div>';
  const movementSent=sentFocus.length?sentFocus.map(p=>`<div class="movement-item"><strong>${p.season} Round ${p.round} sent to ${esc(p.ownerTeam)}</strong><span class="small">Original pick: ${esc(focus.team)}${p.previousOwnerTeam&&p.previousOwnerTeam!==focus.team?` · Last transfer from ${esc(p.previousOwnerTeam)}`:""}</span></div>`).join(""):'<div class="movement-item">No original picks sent away.</div>';

  $("#picks").innerHTML=`
    <div class="panel team-control-panel">
      <div class="section-title">
        <div><h2>Draft Capital</h2><div class="small">Use the header Focus Team selector to highlight the focus team across cards, the ownership matrix and pick movement.</div></div>
        
      </div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Capital at a Glance</h2><span class="small">Relative model value across all tracked future picks</span></div>
      <div class="capital-leaderboard">${[...a.teams].sort((x,y)=>y.pickCapital-x.pickCapital).map((team,i)=>`
        <div class="capital-row">
          <strong>#${i+1} ${esc(team.team)}</strong>
          <div class="capital-track"><div class="capital-fill" style="width:${100*team.pickCapital/maxCapital}%"></div></div>
          <span>${intFmt(team.pickCapital)} · ${team.futureFirsts} firsts</span>
        </div>`).join("")}</div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Team Pick Portfolios</h2><span class="small">Green = own pick; blue = acquired pick</span></div>
      <div class="capital-grid">${cards}</div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>Ownership Matrix</h2><span class="small">Each cell shows whose original pick the current owner controls.</span></div>
      <div class="pick-matrix"><table><thead><tr><th>Current Owner</th>${columns.map(c=>`<th>${c.season} R${c.round}</th>`).join("")}</tr></thead><tbody>${matrixRows}</tbody></table></div>
    </div>
    <div class="panel">
      <div class="section-title"><h2>${esc(focus.team)} Pick Movement</h2><span class="small">Acquired and sent picks</span></div>
      <div class="movement-grid">
        <div><h3>Acquired</h3><div class="movement-list">${movementAcquired}</div></div>
        <div><h3>Sent Away</h3><div class="movement-list">${movementSent}</div></div>
      </div>
    </div>`;
  
}
