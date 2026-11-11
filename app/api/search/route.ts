import { NextRequest, NextResponse } from 'next/server';
import Innertube from 'youtubei.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Video = { id: string; title: string; channel: string; thumbnail: string };
const validId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const x = value as Record<string, unknown>;
  if (typeof x.text === 'string') return x.text;
  if (typeof x.toString === 'function' && x.toString !== Object.prototype.toString) {
    const result = String(x.toString());
    if (result !== '[object Object]') return result;
  }
  if (Array.isArray(x.runs)) return x.runs.map((r) => textOf(r)).join('');
  return '';
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ error: 'Escribe al menos dos caracteres' }, { status: 400 });
  try {
    // This is an unofficial YouTube client. It does not require a YouTube Data API key.
    const youtube = await Innertube.create({ lang: 'es', location: 'PE', retrieve_player: false });
    const search = await youtube.search(q, { type: 'video' });
    const videos: Video[] = [];
    for (const entry of search.videos ?? []) {
      const v = entry as unknown as Record<string, unknown>;
      const id = String(v.id ?? '');
      if (!validId(id) || videos.some((item) => item.id === id)) continue;
      videos.push({
        id,
        title: textOf(v.title) || `Video ${id}`,
        channel: textOf(v.author) || 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      });
      if (videos.length >= 10) break;
    }
    return NextResponse.json({ items: videos }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('YouTube search failed:', error);
    return NextResponse.json({ items: [], error: 'No se pudo consultar YouTube desde este servidor. Intenta de nuevo o pega un enlace.' }, { status: 502 });
  }
}
