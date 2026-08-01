// Browser-local persistence. This is intentionally separate from the network:
// saved analyses and daily player caches never leave the user's browser.
export function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("SleeperDynastyAnalyzer",1);
    req.onupgradeneeded=()=>req.result.createObjectStore("cache");
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}

// key identifies one cached item. db is the IndexedDB database, tx is its
// one-operation transaction, and r is the browser request for that item.
export async function idbGet(key){try{const db=await openDB();return await new Promise((res,rej)=>{const tx=db.transaction("cache","readonly");const r=tx.objectStore("cache").get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}catch{return null}}

export async function idbSet(key,value){try{const db=await openDB();return await new Promise((res,rej)=>{const tx=db.transaction("cache","readwrite");tx.objectStore("cache").put(value,key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}catch{return false}}
