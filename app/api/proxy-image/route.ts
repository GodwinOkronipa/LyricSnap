import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for external images (e.g. iTunes artwork).
 * html-to-image uses an internal canvas; cross-origin images taint the canvas
 * unless served with Access-Control-Allow-Origin. We fetch server-side and
 * relay with permissive CORS so the browser canvas can read pixel data.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Only allow https image URLs to prevent SSRF
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs allowed' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LyricSnap/1.0' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('[proxy-image] Error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
