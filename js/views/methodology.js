import { state } from "../state.js";
import { $, esc } from "../utils.js";

export function renderMethodology(){
  const a=state.analysis;
  $("#methodology").innerHTML=`<div class="panel"><h2>Methodology</h2>
    <div class="grid-2">
      <div><h3>Contender Score Weights</h3><ul class="insight-list">${Object.entries(a.weights).map(([k,v])=>`<li>${esc(k)}: ${(v*100).toFixed(0)}%</li>`).join("")}</ul></div>
      <div><h3>Detected League Settings</h3><ul class="insight-list"><li>${esc(a.formatLabel)}</li><li>${a.totalRosters} teams</li><li>Starting slots: ${esc(a.rosterSlots.join(", "))}</li><li>Current data through week ${a.currentWeek||0}</li></ul></div>
    </div>
    <h3>Calculation Notes</h3>${Object.entries(a.methodology).map(([k,v])=>`<div class="callout"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")}
    <h3>Classification</h3><p>Current rankings combine projected legal lineup strength, depth, recent production, dynasty value, risk and draft capital. Franchise rankings emphasize total dynasty value, young skill-position value and picks.</p><h3>Player Tiers</h3><p>The dedicated Player Tiers page uses a composite score: 60% upcoming-season expected PPG percentile, 25% dynasty-value percentile, and 15% position-adjusted longevity. Tier S represents elite cornerstone profiles, followed by Tiers 1 through 4. Team positional insights continue to use projection-based position ranks.</p>
    <h3>Important Limitations</h3><p>Preseason and in-season projections change quickly. Market values estimate sentiment rather than guaranteed trade prices. Rookie and IDP projections are less reliable. Refresh after major injuries, trades, depth-chart changes and at least weekly during the season.</p>
    <h3>Data Sources</h3><ul class="insight-list"><li>Sleeper public API: league, rosters, managers, matchups, players and traded picks.</li><li>RosterAudit: dynasty values and projections, with visible attribution.</li><li>DynastyProcess: secondary dynasty values and cross-platform IDs.</li></ul>
  </div>`;
}
