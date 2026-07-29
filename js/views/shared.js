// Shared HTML building blocks. Inputs are escaped before being inserted into
// generated markup, including content that originated with an outside API.
import { esc } from "../utils.js";

export function evidenceHtml(items,type){
  return `<div class="insight-stack">${items.map(item=>`
    <div class="insight-evidence ${type}">
      <div class="evidence-title">${esc(item.title)}</div>
      <div class="evidence-detail">${esc(item.detail)}</div>
    </div>`).join("")}</div>`;
}

export function sortableTable(headers,rows,id){
  // headers describes columns, rows supplies records, and id namespaces sorting.
  const keys=headers.map(h=>h.key);return `<div class="table-wrap"><table data-table="${esc(id)}"><thead><tr>${headers.map(h=>`<th data-key="${esc(h.key)}">${esc(h.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td class="${h.num?"num":""}">${h.render?h.render(r):esc(r[h.key]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
