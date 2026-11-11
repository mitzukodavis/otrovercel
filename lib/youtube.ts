export type EmbedStatus='allowed'|'blocked'|'unknown';
export type VideoCheck={id:string;title?:string;embedStatus:EmbedStatus;reason?:string};
const cache=new Map<string,{value:VideoCheck;until:number}>();
export async function checkVideos(ids:string[]):Promise<Record<string,VideoCheck>>{
 const unique=[...new Set(ids)].filter(id=>/^[a-zA-Z0-9_-]{11}$/.test(id));
 const result:Record<string,VideoCheck>={};const missing:string[]=[];
 for(const id of unique){const cached=cache.get(id);if(cached&&cached.until>Date.now())result[id]=cached.value;else missing.push(id)}
 const key=process.env.YOUTUBE_API_KEY;
 if(key){for(let i=0;i<missing.length;i+=50){const batch=missing.slice(i,i+50);try{
  const params=new URLSearchParams({part:'snippet,status',id:batch.join(','),key});
  const r=await fetch('https://www.googleapis.com/youtube/v3/videos?'+params,{cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw Error('YouTube metadata HTTP '+r.status);
  const data=await r.json();const found=new Map<string,any>((data.items||[]).map((v:any)=>[v.id,v]));
  for(const id of batch){const item=found.get(id);const value:VideoCheck=!item?{id,embedStatus:'blocked',reason:'Video no disponible o no público'}:{id,title:item.snippet?.title,embedStatus:item.status?.embeddable===false?'blocked':item.status?.embeddable===true?'allowed':'unknown',reason:item.status?.embeddable===false?'YouTube no permite reproducirlo en reproductores integrados':undefined};result[id]=value;cache.set(id,{value,until:Date.now()+3600000})}
 }catch{for(const id of batch)result[id]={id,embedStatus:'unknown',reason:'No se pudo verificar la reproducción'}}}
 }else for(const id of missing)result[id]={id,embedStatus:'unknown',reason:'Falta YOUTUBE_API_KEY'};
 return result;
}
