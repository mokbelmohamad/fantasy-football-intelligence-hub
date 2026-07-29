// The single shared in-memory state for the browser session.  Every view reads
// from this object, so changing it is how the app keeps its screens in sync.
export const state = {
  // The complete, calculated league report. It is null before an analysis runs.
  analysis: null,
  // Sort direction keyed by "table-name:column-name"; true means ascending.
  sort: {},
  // Reserved storage for player-table filters between renders.
  playerFilter: {},
  // The fantasy team selected in the header and used as the focus across tabs.
  selectedTeam: "",
  // The identifier of the tab currently shown to the user.
  activeView: "dashboard",
};
