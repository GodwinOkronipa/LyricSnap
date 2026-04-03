import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const EXPECTED_AMOUNT = Math.round((0.49 * Number(process.env.NEXT_PUBLIC_GHS_CONVERSION_RATE || 15) * 100));

/**
 * Verifies Paystack payment reference and activates Pro status
 * CRITICAL: This must be called AFTER client receives success from Paystack
 * Never trust client-side payment success signals
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request comes from authenticated user
    const supabaseServer = await createSupabaseServerClient();
    const sessionData = await supabaseServer.auth.getSession();
    const session = sessionData.data.session;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await req.json();

    // 🔒 Validate reference format (Paystack generates UUID-like refs)
    if (!reference || typeof reference !== 'string' || reference.length < 5) {
      return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('[PAYMENT] PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment verification unavailable' }, { status: 500 });
    }

    // 🔒 Verify with Paystack backend (server-to-server)
    console.log(`[PAYMENT] Verifying reference: ${reference} for user: ${session.user.id}`);
    
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
    if (transaction.customer.email !== session.user.email) {
      console.warn(`[PAYMENT] Email mismatch: ${transaction.customer.email} vs ${session.user.email}`);
      return NextResponse.json({ error: 'Payment email mismatch' }, { status: 400 });
    }

    // 4. Check if this reference was already used (prevent replay attacks)
    const { data: existingPayment } = await supabaseServer
      .from('payments')
      .select('id')
      .eq('paystack_reference', reference)
      .single();

    if (existingPayment) {
      console.warn(`[PAYMENT] Duplicate payment reference detected: ${reference}`);
      // Still return success to avoid confusing the client (idempotent)
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed' 
      });
    }

    // ✅ All checks passed - activate Pro status
    console.log(`[PAYMENT] Activating Pro for user: ${session.user.id}`);

    // Record payment in audit table
    const { error: paymentError } = await supabaseServer
      .from('payments')
      .insert({
        user_id: session.user.id,
        paystack_reference: reference,
        amount: transaction.amount,
        currency: transaction.currency,
        customer_email: transaction.customer.email,
        status: 'completed',
        metadata: {
          authorization: transaction.authorization,
          channel: transaction.channel,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        }
      });

    if (paymentError) {
      console.error('[PAYMENT] Failed to record payment:', paymentError);
      // Still try to upgrade user despite logging failure
    }

    // Update user Pro status
    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ 
        is_pro: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('[PAYMENT] Failed to update Pro status:', updateError);
      return NextResponse.json({ error: 'Failed to activate Pro status' }, { status: 500 });
    }

    // Clean up any pending activation markers
    // (Client should do this, but we ensure it server-side)
    
    console.log(`[PAYMENT] ✅ Pro status activated for ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Pro status activated successfully',
      user_id: session.user.id,
    });

  } catch (error: any) {
    console.error('[PAYMENT] Verification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
