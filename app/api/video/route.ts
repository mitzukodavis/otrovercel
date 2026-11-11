import {NextRequest,NextResponse} from 'next/server';
import {getYouTubeTitle} from '../../../lib/rooms';
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('id')||'';
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 const title=await getYouTubeTitle(id);
 return NextResponse.json({title},{headers:{'Cache-Control':'public, max-age=3600'}});
}
