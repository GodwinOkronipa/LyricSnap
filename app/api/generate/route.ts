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
  const supabaseServer = await createSupabaseServerClient();
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

    console.log('[API] Generating image for:', title);
    console.log('[API] Rendering via:', renderUrl);

    let browser;
    try {
      if (isProd) {
        browser = await puppeteer.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          defaultViewport: { width: 800, height: 800 },
          executablePath: await chromium.executablePath(),
          headless: chromium.headless as any,
        });
      } else {
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'],
          defaultViewport: { width: 800, height: 800 },
          executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          headless: true,
        });
      }
    } catch (launchError: any) {
      console.error('[API] Puppeteer Launch Error:', launchError);
      throw new Error(`Browser launch failed: ${launchError.message}`);
    }

    const page = await browser.newPage();
    
    try {
      console.log('[API] Navigating to render URL...');
      await page.goto(renderUrl, { 
        waitUntil: 'networkidle0',
        timeout: 45000 
      });
      
      // Wait a bit for animations and blur filter to settle
      console.log('[API] Waiting for hydration...');
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (gotoError: any) {
      console.error('[API] Page Navigation Error:', gotoError);
      await browser.close();
      throw new Error(`Navigation failed: ${gotoError.message}`);
    }

    // Target the specific component
    console.log('[API] Capturing screenshot...');
    const element = await page.$('#screenshot-target');
    if (!element) {
      await browser.close();
      console.error('[API] Screenshot target (#screenshot-target) not found on page');
      throw new Error('Screenshot target not found');
    }

    const buffer = await element.screenshot({ type: 'png' });
    await browser.close();
    console.log('[API] Screenshot captured successfully');

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
        console.log('[API] Generation logged to database');
      }
    } catch (dbError) {
      console.error('[API] Failed to log generation:', dbError);
    }


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
    console.error('[API] General Generate Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }

}
