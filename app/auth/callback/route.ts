import { createSupabaseServerClient } from '@/lib/supabase-server';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  const origin = requestUrl.origin;

  if (!code) {
    console.error('No code found in auth callback');
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No+code+provided+by+auth+server`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error('Session exchange error:', error.message);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
  } catch (err: any) {
    console.error('Fatal redirect error:', err);
    return new Response(`Error: ${err.message}. Please try again.`, { status: 500 });
  }

}



