import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

const FREE_LIMIT = 3;

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(`log-gen-${clientIp}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: { title?: string; artist?: string; artwork?: string; lyrics?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, artist, artwork, lyrics } = body;

  if (!title || !artist) {
    return NextResponse.json({ error: 'title and artist are required' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // ── Authenticated user ──
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, usage_count')
      .eq('id', session.user.id)
      .single();

    const isPro = profile?.is_pro ?? false;
    const usageCount = profile?.usage_count ?? 0;

    // Server-side limit enforcement (mirrors client-side check)
    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ error: 'Limit reached. Upgrade to Pro.' }, { status: 403 });
    }

    const newCount = usageCount + 1;

    await supabase.from('generations').insert({
      user_id: session.user.id,
      title,
      artist,
      artwork: artwork ?? '',
      lyrics: lyrics ?? [],
    });

    await supabase
      .from('profiles')
      .update({ usage_count: newCount })
      .eq('id', session.user.id);

    return NextResponse.json({ success: true, is_pro: isPro, usage_count: newCount });
  }

  // ── Guest user — nothing to log server-side, client manages localStorage ──
  return NextResponse.json({ success: true, is_pro: false });
}
