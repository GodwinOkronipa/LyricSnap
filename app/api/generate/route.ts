import { NextRequest, NextResponse } from 'next/server';
import { generateMusicPlayerImage } from '@/lib/native-screenshot';
import { verifyToken } from '@/lib/token';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validation';

/**
 * Natively generates and returns the music player image.
 * Uses Satori/Sharp for extremely high performance screenshotting.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // 🛡️ RATE LIMITING: 30 requests per minute per IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  if (!checkRateLimit(`generate-${clientIp}`, 30, 60000)) {
    console.warn(`[API] Rate limit exceeded for IP: ${clientIp}`);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 🛡️ INPUT VALIDATION: Sanitize all parameters
  try {
    const validated = validateInput(
      {
        title: searchParams.get('title'),
        artist: searchParams.get('artist'),
        artwork: searchParams.get('artwork'),
        lyrics: searchParams.get('lyrics'),
        blur: searchParams.get('blur') || '80',
        vignette: searchParams.get('vignette') || '40',
        template: searchParams.get('template') || 'classic',
      },
      {
        title: { type: 'string', required: true, minLength: 1, maxLength: 200, sanitize: true },
        artist: { type: 'string', required: true, minLength: 1, maxLength: 200, sanitize: true },
        artwork: { type: 'url', required: true },
        lyrics: { type: 'string', required: false, maxLength: 50000 },
        blur: { type: 'number', required: false },
        vignette: { type: 'number', required: false },
        template: { type: 'string', required: false, pattern: /^(classic|modern)$/ },
      }
    );

    const title = validated.title;
    const artist = validated.artist;
    const artwork = validated.artwork;
    const lyrics = validated.lyrics;
    const blur = Math.min(Math.max(parseInt(validated.blur), 0), 100); // Clamp 0-100
    const vignette = Math.min(Math.max(parseInt(validated.vignette), 0), 100); // Clamp 0-100
    const template = validated.template as 'classic' | 'modern';

    // 🛡️ SECURITY: Stateless Pro Token Check
    const token = searchParams.get('token');
    let isPro = false;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        isPro = true;
        console.log(`[API] Valid Pro token verified for ${decoded.email}`);
      } else {
        console.warn('[API] Invalid Pro token provided');
      }
    }

    // FORCE WATERMARK if not Pro
    const watermark = !isPro;

    console.log('[API] Generating image for:', title);
    console.log('[API] Using native image generation (no browser required)');
    console.log('[API] Lyrics param:', lyrics ? 'present' : 'absent');
    console.log('[API] Watermark enabled:', watermark);

    // Generate image natively without browser
    let parsedLyrics: any[] | undefined = undefined;
    if (lyrics) {
      try {
        const decodedLyrics = decodeURIComponent(lyrics);
        console.log('[API] Decoded lyrics string:', decodedLyrics.substring(0, 100));
        parsedLyrics = JSON.parse(decodedLyrics);
        console.log('[API] Successfully parsed lyrics, count:', Array.isArray(parsedLyrics) ? parsedLyrics.length : 'invalid');
      } catch (parseError) {
        console.warn('[API] Failed to parse lyrics:', parseError);
        // Continue without lyrics if parsing fails
      }
    }
    
    console.log('[API] Calling generateMusicPlayerImage with:', { title, artist, watermark, template });
    
    const buffer = await generateMusicPlayerImage({
      title,
      artist,
      artwork,
      watermark,
      blur,
      vignette,
      template,
      lyrics: parsedLyrics,
    });

    console.log('[API] Image generated successfully (native)');

    const headers = new Headers({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    if (searchParams.get('download') === 'true') {
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lyricsnap.png`;
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    return new NextResponse(buffer as any, { headers });

  } catch (error: any) {
    console.error('[API] Request Error:', error);
    
    // Don't expose internal error details to client
    const isValidationError = error.name === 'ValidationError';
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
