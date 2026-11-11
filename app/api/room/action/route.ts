import {checkVideos} from '../../../../lib/youtube';
import {NextRequest,NextResponse} from 'next/server';
import {readRoom,valid,mutateRoom,parseIds,getYouTubeTitle,Video} from '../../../../lib/rooms';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){try{
 const body=await req.json();const code=String(body.code||'').toUpperCase();if(!valid(code))return NextResponse.json({error:'Sala inválida'},{status:400});const room=await readRoom(code);if(!room)return NextResponse.json({error:'Sala no encontrada'},{status:404});
 const action=body.action;
 let error:string|null=null;
 const ids=action==='add'?parseIds(String(body.links||'')):[];
 if(action==='add'&&!ids.length)return NextResponse.json({error:'Pega enlaces válidos de videos de YouTube'},{status:400});
 const checks=ids.length?await checkVideos(ids):{};
 const prepared:Video[]=await Promise.all(ids.map(async id=>({id,title:checks[id]?.title||(await getYouTubeTitle(id))||`Video ${id}`,addedBy:String(body.name||'Invitado').slice(0,24),uid:crypto.randomUUID(),embedStatus:checks[id]?.embedStatus||'unknown',embedReason:checks[id]?.reason})));
 const committed=await mutateRoom(code,room=>{
 const isHost=body.hostKey===room.hostKey&&typeof body.hostKey==='string';
 if(action==='reorder'){const from=room.queue.findIndex(v=>v.uid===body.uid);const to=room.queue.findIndex(v=>v.uid===body.beforeUid);if(from<0||to<0){error='Canción no encontrada';return undefined;}if(from!==to){const currentUid=room.queue[room.index]?.uid;const [moved]=room.queue.splice(from,1);room.queue.splice(to,0,moved);room.index=Math.max(0,room.queue.findIndex(v=>v.uid===currentUid));}}
 else if(action==='add'){
 const unique=prepared.filter(v=>!room.queue.some(x=>x.id===v.id));
 if(!unique.length){error='Todos esos videos ya están en la cola';return undefined;}
 if(room.queue.length+unique.length>150){error='Límite de 150 videos por sala';return undefined;}
 room.queue.push(...unique.filter(v=>v.embedStatus!=='blocked'),...unique.filter(v=>v.embedStatus==='blocked'));
 }
 else {if(!isHost){error='Solo la PC anfitriona puede controlar la reproducción';return undefined;}if(action==='heartbeat'){room.hostSeen=Date.now();}
 else if(action==='markBlocked'){const v=room.queue.find(v=>v.uid===body.uid);if(v){v.embedStatus='blocked';v.embedReason='El reproductor de YouTube rechazó este video';const i=room.queue.indexOf(v);room.queue.splice(i,1);if(i<room.index)room.index--;else if(i===room.index&&room.index>=room.queue.length)room.index=0;room.queue.push(v);if(room.queue.every(x=>x.embedStatus==='blocked'))room.playing=false;} }
 else if(action==='next'){
  // A finished song leaves the upcoming queue and enters the permanent room history.
  const finished=room.queue[room.index];
  if(finished){room.history=[...(room.history||[]),{...finished,playedAt:Date.now()}];room.queue.splice(room.index,1)}
  if(room.index>=room.queue.length)room.index=Math.max(0,room.queue.length-1);
  // Do not make blocked videos the next song; keep them at the end for inspection.
  if(room.queue.length&&room.queue[room.index]?.embedStatus==='blocked'){const playable=room.queue.findIndex((v,i)=>i>=room.index&&v.embedStatus!=='blocked');if(playable>=0){const [v]=room.queue.splice(playable,1);room.queue.splice(room.index,0,v)}else room.playing=false}
  if(!room.queue.length)room.playing=false;
 }
 else if(action==='play'){room.playing=true}
 else if(action==='pause'){room.playing=false}
 else if(action==='remove'){const i=room.queue.findIndex(v=>v.uid===body.uid);if(i>=0){room.queue.splice(i,1);if(i<room.index)room.index--;room.index=Math.max(0,Math.min(room.index,room.queue.length-1));if(!room.queue.length)room.playing=false}}
 else if(action==='select'){
  const i=room.queue.findIndex(v=>v.uid===body.uid);
  if(i>=0){
   // A manually skipped track was played too; keep it in history.
   if(room.playing&&room.queue[room.index]&&i!==room.index){
    const previous=room.queue[room.index];
    room.history=[...(room.history||[]),{...previous,playedAt:Date.now()}];
    room.queue.splice(room.index,1);
    room.index=i>room.index?i-1:i;
   }else room.index=i;
   room.playing=true;
  }
 }
 else if(action==='clear'){room.queue=[];room.index=0;room.playing=false}
 else {error='Acción desconocida';return undefined;}}

 return room;
 });
 if(!committed){console.warn('[Jam action] rejected',{code,action,reason:error||'transaction not committed'});return NextResponse.json({error:error||'No se pudo actualizar la sala (transacción cancelada)',code,action},{status:409});}
 return NextResponse.json({ok:true});
 }catch(e){console.error('[Jam action] Firebase error',e);return NextResponse.json({error:'No se pudo actualizar la lista',detail:String(e)},{status:500})}}
