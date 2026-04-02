import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Missing+auth+code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error('Auth callback exchange error:', error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
  } catch (err: any) {
    console.error('Fatal auth callback error:', err);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Internal+server+error+during+auth`);
  }
}


