import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const artwork = searchParams.get('artwork');
  const lyrics = searchParams.get('lyrics');

  if (!title || !artist || !artwork) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // 🛡️ SECURITY: Server-side Auth & Limit Check
  const supabaseServer = createSupabaseServerClient();
  const sessionData = await supabaseServer.auth.getSession();
  const session = sessionData.data.session;
  
  let isPro = false;
  let usageCount = 0;

  if (session) {
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('is_pro, usage_count')
      .eq('id', session.user.id)
      .single();
    
    if (profile) {
      isPro = profile.is_pro;
      usageCount = profile.usage_count;
    }
  }

  // FORCE WATERMARK if not Pro
  const watermark = !isPro;
  const blur = searchParams.get('blur') || '80';
  const vignette = searchParams.get('vignette') || '40';
  const template = searchParams.get('template') || 'classic';

  // FREE LIMIT CHECK (Server-side)
  if (!isPro && usageCount >= 1 && session) {
     return NextResponse.json({ error: 'Limit reached. Upgrade to Pro.' }, { status: 403 });
  }

  try {
    const isProd = process.env.NODE_ENV === 'production';
    
    // Determine the local URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    let renderUrl = `${protocol}://${host}/render?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&artwork=${encodeURIComponent(artwork)}&watermark=${watermark}&blur=${blur}&vignette=${vignette}&template=${template}`;
    
    if (lyrics) {
      renderUrl += `&lyrics=${encodeURIComponent(lyrics)}`;
    }

    let browser;
    if (isProd) {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 800, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as any,
      });
    } else {
      browser = await puppeteer.launch({
        args: [],
        defaultViewport: { width: 800, height: 800 },
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.goto(renderUrl, { waitUntil: 'networkidle2' });

    // Target the specific component
    const element = await page.$('#screenshot-target');
    if (!element) {
      await browser.close();
      throw new Error('Screenshot target not found');
    }

    const buffer = await element.screenshot({ type: 'png' });
    await browser.close();

    // Log the generation to Supabase
    try {
      if (session) {
        const newCount = usageCount + 1;
        await supabaseServer.from('generations').insert({
          user_id: session.user.id,
          title: title,
          artist: artist,
          artwork: artwork,
          lyrics: lyrics ? JSON.parse(decodeURIComponent(lyrics)) : []
        });
        await supabaseServer.from('profiles').update({ usage_count: newCount }).eq('id', session.user.id);
      }
    } catch (dbError) {
      console.error('Failed to log generation:', dbError);
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
