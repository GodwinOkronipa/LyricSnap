import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/token';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const EXPECTED_AMOUNT = Math.round((0.49 * Number(process.env.NEXT_PUBLIC_GHS_CONVERSION_RATE || 15) * 100));

/**
 * Verifies Paystack payment reference and returns signed token for stateless Pro status
 */
export async function POST(req: NextRequest) {
  try {
    const { reference, email } = await req.json();

    // 🔒 Validate input fields
    if (!reference || typeof reference !== 'string' || reference.length < 5) {
      return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('[PAYMENT] PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment verification unavailable' }, { status: 500 });
    }

    // 🔒 Verify with Paystack backend (server-to-server)
    console.log(`[PAYMENT] Verifying reference: ${reference} for email: ${email}`);
    
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paystackResponse.ok) {
      console.error(`[PAYMENT] Paystack verification failed: ${paystackResponse.status}`);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: paystackResponse.status });
    }

    const paystackData = await paystackResponse.json();
    const transaction = paystackData.data;

    // 🔒 CRITICAL SECURITY CHECKS
    // 1. Verify payment was successful
    if (transaction.status !== 'success') {
      console.warn(`[PAYMENT] Transaction status not success: ${transaction.status}`);
      return NextResponse.json({ error: 'Payment did not complete successfully' }, { status: 400 });
    }

    // 2. Verify amount matches expected (prevent underpayment)
    if (transaction.amount !== EXPECTED_AMOUNT) {
      console.error(`[PAYMENT] Amount mismatch: received ${transaction.amount}, expected ${EXPECTED_AMOUNT}`);
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // 3. Verify customer email matches session email
    if (transaction.customer.email.toLowerCase() !== email.toLowerCase()) {
      console.warn(`[PAYMENT] Email mismatch: ${transaction.customer.email} vs ${email}`);
      return NextResponse.json({ error: 'Payment email mismatch' }, { status: 400 });
    }

    // ✅ All checks passed - generate stateless cryptographic token
    const token = signToken(email.toLowerCase(), reference);

    console.log(`[PAYMENT] ✅ Pro status activated for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Pro status activated successfully',
      token,
      email: email.toLowerCase()
    });

  } catch (error: any) {
    console.error('[PAYMENT] Verification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
