// Shared HTML building blocks. Inputs are escaped before being inserted into
// generated markup, including content that originated with an outside API.
import { esc, fmt, num } from "../utils.js";

// A team can rank behind the Contender Index leader while projecting for more
// weekly points. Show that fact with a plus sign instead of constructing a
// misleading double-negative gap.
export function gapToLeaderLabel(leaderPpg, teamPpg) {
  const difference = num(leaderPpg) - num(teamPpg);
  if (difference === 0) return "Even";
  return `${difference > 0 ? "-" : "+"}${fmt(Math.abs(difference), 2)}`;
}

export function evidenceHtml(items,type){
  return `<div class="insight-stack">${items.map(item=>`
    <div class="insight-evidence ${type}">
      <div class="evidence-title">${esc(item.title)}</div>
      <div class="evidence-detail">${esc(item.detail)}</div>
    </div>`).join("")}</div>`;
}

// Detailed, reusable analytical cards for the Dashboard and Team Insights.
// Each item can include a narrative summary plus labeled supporting metrics.
export function teamInsightReviewHtml(items,type){
  const heading=type==="strength"?"Team Strengths":"Areas to Improve";
  const intro=type==="strength"
    ?"The roster advantages most likely to support a championship run, based on projected production, depth, dynasty value, and risk."
    :"The roster limitations most likely to reduce championship odds, create lineup volatility, or require a targeted move.";
  if(!items.length)return `<section class="team-insight-review ${type}"><div class="team-insight-review-heading"><h3>${heading}</h3><p>${intro}</p></div><p class="small">No evidence is available for this report.</p></section>`;
  return `<section class="team-insight-review ${type}">
    <div class="team-insight-review-heading"><h3>${heading}</h3><p>${intro}</p></div>
    <div class="team-insight-review-grid">${items.map((item,index)=>`<article class="team-insight-card ${type}">
      <div class="team-insight-number">${index+1}</div>
      <div class="team-insight-content">
        <h4>${esc(item.title)}</h4>
        <p>${esc(item.summary||item.detail||"")}</p>
        ${(item.metrics||[]).length?`<div class="team-insight-data" aria-label="${esc(item.title)} supporting data">${item.metrics.map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong></div>`).join("")}</div>`:""}
      </div>
    </article>`).join("")}</div>
  </section>`;
}

export function sortableTable(headers,rows,id){
  // headers describes columns, rows supplies records, and id namespaces sorting.
  const keys=headers.map(h=>h.key);return `<div class="table-wrap"><table data-table="${esc(id)}"><thead><tr>${headers.map(h=>`<th data-key="${esc(h.key)}">${esc(h.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td class="${h.num?"num":""}">${h.render?h.render(r):esc(r[h.key]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
