export function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("SleeperDynastyAnalyzer",1);
    req.onupgradeneeded=()=>req.result.createObjectStore("cache");
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}

export async function idbGet(key){try{const db=await openDB();return await new Promise((res,rej)=>{const tx=db.transaction("cache","readonly");const r=tx.objectStore("cache").get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}catch{return null}}

export async function idbSet(key,value){try{const db=await openDB();return await new Promise((res,rej)=>{const tx=db.transaction("cache","readwrite");tx.objectStore("cache").put(value,key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}catch{return false}}

export async function idbDelete(key){try{const db=await openDB();return await new Promise((res,rej)=>{const tx=db.transaction("cache","readwrite");tx.objectStore("cache").delete(key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}catch{return false}}
