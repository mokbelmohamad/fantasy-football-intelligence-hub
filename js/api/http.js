export async function fetchWithTimeout(url,opts={},timeout=45000){
  const controller=new AbortController();const t=setTimeout(()=>controller.abort(),timeout);
  try{const r=await fetch(url,{...opts,signal:controller.signal,cache:"no-store"});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r}
  finally{clearTimeout(t)}
}

export async function fetchJson(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).json()}

export async function fetchText(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).text()}

export async function allSettledMap(items,worker,concurrency=6){
  const out=new Array(items.length);let cursor=0;
  async function run(){while(cursor<items.length){const i=cursor++;try{out[i]={status:"fulfilled",value:await worker(items[i],i)}}catch(e){out[i]={status:"rejected",reason:e}}}}
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},run));return out
}


export async function loadJsonSnapshot(path, validator = (value) => value != null) {
  try {
    const value = await fetchJson(path, 10000);
    return validator(value) ? value : null;
  } catch {
    return null;
  }
}
