import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateInput, ValidationError } from '@/lib/validation';

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
  source?: 'itunes' | 'genius';
}

async function searchItunes(query: string): Promise<Song[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
    const response = await fetch(url);
    const data = await response.json();

    return data.results.map((item: any) => ({
      id: item.trackId,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      artwork: item.artworkUrl100.replace('100x100bb.jpg', '1024x1024bb.jpg'),
      previewUrl: item.previewUrl,
      source: 'itunes',
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

async function searchGenius(query: string): Promise<Song[]> {
  try {
    // Unofficial Genius API used by their web app
    const url = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const data = await response.json();

    const songSection = data.response.sections.find((s: any) => s.type === 'song');
    if (!songSection || !songSection.hits) return [];

    return songSection.hits.map((hit: any) => {
      const result = hit.result;
      return {
        id: result.id,
        title: result.title,
        artist: result.primary_artist.name,
        album: result.album?.name || 'Unknown Album',
        artwork: result.song_art_image_url,
        previewUrl: '', // Genius doesn't provide preview URLs in this endpoint
        source: 'genius',
      };
    }).slice(0, 10);
  } catch (error) {
    console.error('Genius search error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // 🛡️ RATE LIMITING: 60 requests per minute per IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  if (!checkRateLimit(`search-${clientIp}`, 60, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  
  // 🛡️ INPUT VALIDATION
  try {
    const validated = validateInput(
      {
        q: searchParams.get('q'),
        type: searchParams.get('type') || 'tracks',
      },
      {
        q: { type: 'string', required: true, minLength: 1, maxLength: 100, sanitize: true },
        type: { type: 'string', required: false, pattern: /^(tracks|lyrics)$/ },
      }
    );

    const query = validated.q;
    const type = validated.type as 'tracks' | 'lyrics';

    let results: Song[] = [];

    if (type === 'lyrics') {
      results = await searchGenius(query);
      // If no results from Genius, fallback to iTunes just in case
      if (results.length === 0) {
        results = await searchItunes(query);
      }
    } else {
      results = await searchItunes(query);
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('[Search API] Error:', error);
    
    const isValidationError = error instanceof ValidationError;
    const statusCode = isValidationError ? 400 : 500;
    const errorMessage = isValidationError 
      ? error.message 
      : 'Internal server error';

    return NextResponse.json({ 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }
}
