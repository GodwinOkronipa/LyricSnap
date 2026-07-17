import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'godwinokro2020@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0);

/**
 * Validates a stateless Pro token and returns the Pro/Admin status.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        is_pro: false, 
        authenticated: false 
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ 
        is_pro: false, 
        authenticated: false 
      });
    }

    const email = decoded.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(email);

    return NextResponse.json({
      is_pro: true,
      is_admin: isAdmin,
      authenticated: false, // No session-based auth anymore
      email: decoded.email,
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
