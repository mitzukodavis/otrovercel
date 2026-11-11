import {NextRequest,NextResponse} from 'next/server';
import {readRoom,valid,writeRoom,parseIds,Video} from '../../../../lib/rooms';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){try{
 const body=await req.json();const code=String(body.code||'').toUpperCase();if(!valid(code))return NextResponse.json({error:'Sala inválida'},{status:400});const room=await readRoom(code);if(!room)return NextResponse.json({error:'Sala no encontrada'},{status:404});
 const isHost=body.hostKey===room.hostKey&&typeof body.hostKey==='string';const action=body.action;
 if(action==='reorder'){const from=room.queue.findIndex(v=>v.uid===body.uid);const to=room.queue.findIndex(v=>v.uid===body.beforeUid);if(from<0||to<0)return NextResponse.json({error:'Canción no encontrada'},{status:400});if(from!==to){const currentUid=room.queue[room.index]?.uid;const [moved]=room.queue.splice(from,1);room.queue.splice(to,0,moved);room.index=Math.max(0,room.queue.findIndex(v=>v.uid===currentUid));}}
 else if(action==='add'){const ids=parseIds(String(body.links||''));if(!ids.length)return NextResponse.json({error:'Pega enlaces válidos de videos de YouTube'},{status:400});const unique=ids.filter(id=>!room.queue.some(v=>v.id===id));if(!unique.length)return NextResponse.json({error:'Todos esos videos ya están en la cola',added:0},{status:409});if(room.queue.length+unique.length>150)return NextResponse.json({error:'Límite de 150 videos por sala'},{status:400});const name=String(body.name||'Invitado').slice(0,24);const videos:Video[]=unique.map(id=>({id,title:'Video de YouTube',addedBy:name,uid:crypto.randomUUID()}));room.queue.push(...videos)}
 else {if(!isHost)return NextResponse.json({error:'Solo la PC anfitriona puede controlar la reproducción'},{status:403});if(action==='heartbeat'){room.hostSeen=Date.now();return NextResponse.json({ok:true})}
 if(action==='next'){if(room.index<room.queue.length-1)room.index++;else room.playing=false}
 else if(action==='play'){room.playing=true}
 else if(action==='pause'){room.playing=false}
 else if(action==='remove'){const i=room.queue.findIndex(v=>v.uid===body.uid);if(i>=0){room.queue.splice(i,1);if(i<room.index)room.index--;room.index=Math.max(0,Math.min(room.index,room.queue.length-1));if(!room.queue.length)room.playing=false}}
 else if(action==='select'){const i=room.queue.findIndex(v=>v.uid===body.uid);if(i>=0){room.index=i;room.playing=true}}
 else if(action==='clear'){room.queue=[];room.index=0;room.playing=false}
 else return NextResponse.json({error:'Acción desconocida'},{status:400});}
 await writeRoom(room);return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:'No se pudo actualizar la lista',detail:String(e)},{status:500})}}
