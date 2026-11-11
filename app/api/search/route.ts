import {NextRequest,NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
type Video={id:string;title:string;channel:string;thumbnail:string};
const validId=(id:string)=>/^[a-zA-Z0-9_-]{11}$/.test(id);
// Public Invidious instances are independent services; their availability can change.
const INSTANCES=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://invidious.privacyredirect.com'];
async function queryInstance(base:string,q:string):Promise<Video[]>{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4500);
 try{
  const url=base+'/api/v1/search?'+new URLSearchParams({q,type:'video',sort_by:'relevance'});
  const r=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('Search provider unavailable');
  const raw:unknown=await r.json();if(!Array.isArray(raw))throw Error('Invalid response');
  const items:Video[]=[];
  for(const v of raw){if(!v||typeof v!=='object')continue;const x=v as Record<string,unknown>;
   const id=String(x.videoId||'');if(!validId(id)||x.type!=='video'||items.some(item=>item.id===id))continue;
   items.push({id,title:String(x.title||'Video de YouTube').slice(0,250),channel:String(x.author||'YouTube').slice(0,150),thumbnail:`https://img.youtube.com/vi/${id}/mqdefault.jpg`});
   if(items.length===10)break;
  }
  return items;
 }finally{clearTimeout(timeout)}
}
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get('q')||'').trim().slice(0,120);
 if(q.length<2)return NextResponse.json({error:'Escribe al menos dos caracteres'},{status:400});
 for(const base of INSTANCES){try{const items=await queryInstance(base,q);if(items.length)return NextResponse.json({items},{headers:{'Cache-Control':'no-store'}})}catch{/* Try next public instance */}}
 return NextResponse.json({items:[],error:'Los buscadores públicos no están disponibles ahora. Puedes pegar un enlace de YouTube directamente en la sala.'},{status:503,headers:{'Cache-Control':'no-store'}});
}
