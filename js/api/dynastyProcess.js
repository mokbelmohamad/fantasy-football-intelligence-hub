import { API } from "../config.js";
    import {
      fetchText,
      loadJsonSnapshot,
    } from "./http.js";

    // Parses CSV locally because DynastyProcess publishes its lookup data as CSV.
    // rows is the completed table, row is the record being built, and cell is
    // the current field. quoted prevents commas inside names from splitting a field.
    export function parseCSV(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){cell+='"';i++}
    else if(c==='"')quoted=!quoted;
    else if(c===","&&!quoted){row.push(cell);cell=""}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);cell="";if(row.some(v=>v!==""))rows.push(row);row=[]}
    else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);rows.push(row)}
  if(!rows.length)return [];
  const h=rows[0].map(x=>x.trim());
  return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??""])));
}

    // Uses the packaged snapshot first, then downloads both the ID crosswalk
    // and the valuation table needed to match it to Sleeper players.
    export async function loadDynastyProcessData() {
      const snapshot = await loadJsonSnapshot(
        "./data/dynasty-process.json",
        (value) => (
          Array.isArray(value?.ids)
          && Array.isArray(value?.values)
          && (value.ids.length > 0 || value.values.length > 0)
        ),
      );

      if (snapshot) {
        return {
          ids: snapshot.ids,
          values: snapshot.values,
          source: "snapshot",
        };
      }

      const [idsText, valuesText] = await Promise.all([
        fetchText(API.dpIds, 45000),
        fetchText(API.dpValues, 45000),
      ]);

      return {
        ids: parseCSV(idsText),
        values: parseCSV(valuesText),
        source: "live",
      };
    }
