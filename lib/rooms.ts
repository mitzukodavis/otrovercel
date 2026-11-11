import { list, put } from '@vercel/blob';
export type Video={id:string;title:string;addedBy:string;uid:string};
export type Room={code:string;queue:Video[];index:number;hostKey:string;hostSeen:number;playing:boolean;updatedAt:number;version:number};
const path=(code:string)=>`jam-rooms/${code}.json`;
export function valid(code:string){return /^[A-Z0-9]{6}$/.test(code)}
export async function readRoom(code:string):Promise<Room|null>{
 const {blobs}=await list({prefix:path(code),limit:100});
 const blob=blobs.find(b=>b.pathname===path(code));if(!blob)return null;
 const r=await fetch(blob.url+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('No se pudo leer la sala');
 return await r.json() as Room;
}
export async function writeRoom(room:Room){room.updatedAt=Date.now();room.version=(room.version||0)+1;await put(path(room.code),JSON.stringify(room),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});}
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
