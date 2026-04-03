import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Define admin emails server-side only (not exposed to client)
const ADMIN_EMAILS = [
  'godwinokro2020@gmail.com',
  // Add other admins here
];

/**
 * Returns user's pro status and admin status
 * CRITICAL: This is the source of truth - never trust client claims
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const sessionData = await supabaseServer.auth.getSession();
    const session = sessionData.data.session;

    if (!session) {
      return NextResponse.json({ 
        is_pro: false, 
        is_admin: false,
        authenticated: false 
      });
    }

    const userEmail = session.user.email;

    // Check if user is admin (server-side authority)
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

    // Get pro status from database
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('is_pro, usage_count')
      .eq('id', session.user.id)
      .single();

    // Admins are automatically pro
    const isPro = isAdmin || profile?.is_pro || false;

    return NextResponse.json({
      is_pro: isPro,
      is_admin: isAdmin,
      authenticated: true,
      user_id: session.user.id,
      email: userEmail,
    });

  } catch (error: any) {
    console.error('[Auth] Status check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      is_pro: false,
      is_admin: false,
      authenticated: false,
    }, { status: 500 });
  }
}
