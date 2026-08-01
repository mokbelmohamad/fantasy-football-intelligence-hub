// Network building blocks. timeout is milliseconds; controller allows a slow
// request to be cancelled instead of leaving the analysis waiting forever.
export async function fetchWithTimeout(url,opts={},timeout=45000){
  const controller=new AbortController();const t=setTimeout(()=>controller.abort(),timeout);
  try{const r=await fetch(url,{...opts,signal:controller.signal,cache:"no-store"});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r}
  finally{clearTimeout(t)}
}

export async function fetchJson(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).json()}

// Retries protect deferred, read-only Sleeper history requests from temporary
// upstream failures. The short backoff is network recovery time, not a
// manufactured loading delay, and the final failure is returned to the view.
export async function fetchJsonWithRetry(url, timeout = 45000, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJson(url, timeout);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function fetchText(url,timeout=45000){return (await fetchWithTimeout(url,{},timeout)).text()}

export async function allSettledMap(items,worker,concurrency=6){
  // Processes a long list in small parallel batches. cursor assigns the next
  // item to a worker, while out preserves the same order as the input list.
  const out=new Array(items.length);let cursor=0;
  async function run(){while(cursor<items.length){const i=cursor++;try{out[i]={status:"fulfilled",value:await worker(items[i],i)}}catch(e){out[i]={status:"rejected",reason:e}}}}
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},run));return out
}


export async function loadJsonSnapshot(path, validator = (value) => value != null) {
  // Local snapshots make the app usable when a live third-party API is down.
  try {
    const value = await fetchJson(path, 10000);
    return validator(value) ? value : null;
  } catch {
    return null;
  }
}
