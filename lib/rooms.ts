import {getDatabase} from './firebase-admin';
export type Video={id:string;title:string;addedBy:string;uid:string;embedStatus?:'allowed'|'blocked'|'unknown';embedReason?:string};
export type PlayedVideo=Video & {playedAt:number};
export type Room={code:string;history?:PlayedVideo[];queue:Video[];index:number;hostKey:string;hostSeen:number;playing:boolean;updatedAt:number;version:number};
export function normalizeRoom(value:any):Room{
 const asList=(v:any):any[]=>Array.isArray(v)?v:v&&typeof v==='object'?Object.keys(v).sort((a,b)=>Number(a)-Number(b)).map(k=>v[k]).filter(Boolean):[];
 return {...value,queue:asList(value?.queue),history:asList(value?.history),index:Number.isInteger(value?.index)?value.index:0,playing:value?.playing===true,hostSeen:Number(value?.hostSeen)||0};
}

export function cleanFirebase<T>(value:T):T{
 return JSON.parse(JSON.stringify(value)) as T;
}
export function valid(code:string){return /^[A-Z0-9]{6}$/.test(code)}
export async function readRoom(code:string):Promise<Room|null>{
 if(!valid(code))return null;
 const [snap,key]=await Promise.all([getDatabase().ref('rooms/'+code).get(),getDatabase().ref('hostKeys/'+code).get()]);return snap.exists()?normalizeRoom({...snap.val(),hostKey:key.val()||''}):null;
}
export async function createRoom(room:Room):Promise<boolean>{
 const ref=getDatabase().ref('rooms/'+room.code);
 const {hostKey,...publicRoom}=room;
 const result=await ref.transaction(current=>current===null?cleanFirebase({...publicRoom,updatedAt:Date.now(),version:1}):undefined,undefined,false);
 if(result.committed)await getDatabase().ref('hostKeys/'+room.code).set(hostKey);
 return result.committed;
}
export async function mutateRoom(code:string,mutate:(room:Room)=>Room|undefined):Promise<boolean>{
 const ref=getDatabase().ref('rooms/'+code);
 const keySnap=await getDatabase().ref('hostKeys/'+code).get();
 const hostKey=String(keySnap.val()||'');
 // Preload remote state: otherwise an initial locally uncached null may abort the transaction.
 const before=await ref.get();
 if(!before.exists())throw new Error('ROOM_NOT_FOUND: '+code);
 const result=await ref.transaction(current=>{
  // Firebase Admin transactions can invoke the updater with an initially uncached null.
  // Seed the first attempt from the server snapshot; Firebase checks the server hash
  // and retries with the latest value if another writer changed it.
  const source=current===null?before.val():current;
  if(!source)return undefined;
  const next=mutate(normalizeRoom({...source,hostKey}));if(!next)return undefined;
  next.updatedAt=Date.now();next.version=(next.version||0)+1;
  const {hostKey:_privateKey,...publicRoom}=next;return cleanFirebase(publicRoom);
 },undefined,false);
 if(!result.committed){
  const after=await ref.get();
  console.warn('[Jam Firebase] Transaction not committed', {code,exists:after.exists(),version:after.val()?.version});
 }
 return result.committed;
}
export function parseIds(input:string):string[]{
 const found:string[]=[];
 // Admit URLs pasted with commas, newlines, surrounding punctuation and plain IDs.
 for(const raw of input.split(/[\s,]+/)){
  const item=raw.trim().replace(/^[<('"\[]+|[>)'"\].;]+$/g,'');
  if(!item)continue;
  let id='';
  if(/^[a-zA-Z0-9_-]{11}$/.test(item))id=item;
  else try{
   const u=new URL(/^https?:\/\//i.test(item)?item:'https://'+item);
   const host=u.hostname.toLowerCase().replace(/^www\./,'');
   const parts=u.pathname.split('/').filter(Boolean);
   if(host==='youtu.be')id=parts[0]||'';
   else if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(host)){
    if(parts[0]==='watch')id=u.searchParams.get('v')||'';
    else if(['shorts','live','embed','v'].includes(parts[0]))id=parts[1]||'';
    else if(parts[0]==='attribution_link'){
     const inner=u.searchParams.get('u')||u.searchParams.get('url')||'';
     const innerUrl=new URL(inner,'https://www.youtube.com');id=innerUrl.searchParams.get('v')||'';
    }
    else id=u.searchParams.get('v')||'';
   }
  }catch{}
  if(/^[a-zA-Z0-9_-]{11}$/.test(id)&&!found.includes(id))found.push(id);
 }
 return found.slice(0,40);
}

// YouTube oEmbed returns public video titles without an API key.
// Some videos do not expose oEmbed metadata (private, age restricted, unavailable).
export async function getYouTubeTitle(id:string):Promise<string|null>{
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
 try{
  const url='https://www.youtube.com/oembed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id)+'&format=json';
  const response=await fetch(url,{signal:AbortSignal.timeout(4500),next:{revalidate:3600}});
  if(!response.ok)return null;
  const data=await response.json() as {title?:unknown};
  return typeof data.title==='string'&&data.title.trim()?data.title.trim().slice(0,180):null;
 }catch{return null}
}
