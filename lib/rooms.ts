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
export function parseIds(input:string):string[]{const found:string[]=[];for(const item of input.split(/[\s,]+/)){if(!item)continue;try{const u=new URL(item);let id='';if(['youtu.be','www.youtu.be'].includes(u.hostname))id=u.pathname.split('/')[1];else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname)){id=u.searchParams.get('v')||'';if(!id&&u.pathname.startsWith('/shorts/'))id=u.pathname.split('/')[2];if(!id&&u.pathname.startsWith('/live/'))id=u.pathname.split('/')[2];}if(/^[a-zA-Z0-9_-]{11}$/.test(id)&&!found.includes(id))found.push(id)}catch{if(/^[a-zA-Z0-9_-]{11}$/.test(item)&&!found.includes(item))found.push(item)}}return found.slice(0,40)}
