import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Video = { id: string; title: string; channel: string; thumbnail: string };
type CacheEntry = { items: Video[]; expires: number };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  if (q.length < 2) return NextResponse.json({ error: 'Escribe al menos 2 caracteres.' }, { status: 400 });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: 'Falta configurar YOUTUBE_API_KEY en Vercel.' }, { status: 503 });
  const cacheKey = q.toLocaleLowerCase('es');
  const stored = cache.get(cacheKey);
  if (stored && stored.expires > Date.now()) return NextResponse.json({ items: stored.items, cached: true });
  try {
    const params = new URLSearchParams({ part: 'snippet', type: 'video', maxResults: '15', q, key, safeSearch: 'moderate', regionCode: 'PE', relevanceLanguage: 'es' });
    const response = await fetch('https://www.googleapis.com/youtube/v3/search?' + params.toString(), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      const reason = data?.error?.errors?.[0]?.reason;
      console.error('YouTube Data API search:', response.status, reason);
      const message = reason === 'quotaExceeded' || reason === 'dailyLimitExceeded'
        ? 'Se agotó la cuota gratuita de búsquedas por hoy. Puedes pegar enlaces directamente.'
        : 'No se pudo buscar en YouTube. Comprueba que la API esté habilitada y que la clave tenga permiso.';
      return NextResponse.json({ error: message }, { status: response.status === 403 ? 429 : 502 });
    }
    const items: Video[] = (data.items ?? []).flatMap((entry: any) => {
      const id = entry?.id?.videoId;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return [];
      return [{ id, title: entry.snippet?.title || `Video ${id}`, channel: entry.snippet?.channelTitle || 'YouTube', thumbnail: entry.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${id}/mqdefault.jpg` }];
    });
    if (cache.size > 300) cache.clear();
    cache.set(cacheKey, { items, expires: Date.now() + CACHE_MS });
    return NextResponse.json({ items, cached: false });
  } catch (error) {
    console.error('YouTube search request error:', error);
    return NextResponse.json({ error: 'No se pudo conectar a YouTube. Puedes pegar un enlace.' }, { status: 502 });
  }
}
