import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Define admin emails server-side only (not exposed to client)
// Read from environment variable or use default
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'godwinokro2020@gmail.com')
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

/**
 * Returns user's pro status and admin status
 * CRITICAL: This is the source of truth - never trust client claims
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    
    // Get session from server - this reads from cookies
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    
    if (sessionError) {
      console.error('[Auth] Session error:', sessionError);
    }

    if (!session) {
      console.log('[Auth] No session found');
      return NextResponse.json({ 
        is_pro: false, 
        is_admin: false,
        authenticated: false 
      });
    }

    const userEmail = session.user.email;
    console.log('[Auth Status] Checking email:', userEmail);
    console.log('[Auth Status] Admin list:', ADMIN_EMAILS);

    // Check if user is admin (server-side authority) - case insensitive
    const isAdmin = userEmail 
      ? ADMIN_EMAILS.some(admin => admin.toLowerCase() === userEmail.toLowerCase())
      : false;
    
    console.log('[Auth Status] Is user admin?', isAdmin);
    
    if (isAdmin) {
      console.log('✅ ADMIN DETECTED - Granting automatic Pro status');
    }

    // Get pro status from database
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('is_pro, usage_count')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Auth] Profile fetch error:', profileError);
    }

    // Admins are automatically pro
    const isPro = isAdmin || profile?.is_pro || false;

    return NextResponse.json({
      is_pro: isPro,
      is_admin: isAdmin,
      authenticated: true,
      user_id: session.user.id,
      email: userEmail,
      debug: { isAdmin, profileIsPro: profile?.is_pro },
    });

  } catch (error: any) {
    console.error('[Auth] Status check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      detail: error.message,
      is_pro: false,
      is_admin: false,
      authenticated: false,
    }, { status: 500 });
  }
}
