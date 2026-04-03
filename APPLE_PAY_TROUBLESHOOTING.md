# Apple Pay Troubleshooting Guide

## Issue: Apple Pay Not Showing in Paystack Checkout

### Root Causes (in order of likelihood)

#### 1. **Apple Pay Not Enabled in Paystack Account** 🔴 MOST LIKELY
- Apple Pay is not a default payment method on Paystack
- Must be explicitly enabled in your Paystack dashboard

**Fix:**
1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings** → **Payment Methods** 
3. Look for **Apple Pay** or **Apple Payment Method**
4. Enable it (if available for your region)
5. Add `NEXT_PUBLIC_ENABLE_APPLE_PAY=true` to `.env.local`

---

#### 2. **Currency Not Supported**
- Apple Pay may not support **GHS (Ghana Cedis)** through Paystack
- Apple Pay typically supports: USD, EUR, GBP, AUD, etc.

**Check:**
```bash
# Verify currency support in Paystack docs or account
# https://paystack.com/docs/payments/payment-method-enabled-by-default/
```

**Fix (if currency is issue):**
- Add USD payment option alongside GHS
- Or contact Paystack support to enable GHS for Apple Pay

---

#### 3. **Browser/Device Not Compatible**
- Apple Pay requires:
  - **Safari** on iOS/iPadOS (version 10+)
  - **Safari** on macOS (version 10.1+)
  - **Chrome/Edge** on macOS with Apple Pay enabled
  - Tests on Android: Won't show Apple Pay

**Current Status:**
- ✅ Correctly configured for compatible devices only
- Paystack SDK automatically hides on unsupported devices

---

#### 4. **HTTPS Not Enabled**
- Apple Pay only works on HTTPS (not HTTP)
- Development servers need HTTPS setup

**Check:**
```bash
# Verify your domain uses HTTPS
curl -I https://yourdomain.com
# Should return 200, not redirect to http
```

---

### Diagnostic Steps

#### Step 1: Check Environment Variable
```bash
echo $NEXT_PUBLIC_ENABLE_APPLE_PAY
# Should output: true (if you set it)
```

#### Step 2: Check Browser Console
Open DevTools → Console and look for Paystack logs:
```
[Paystack] Initializing payment modal...
[Paystack] Available channels: card, bank, ussd, qr, mobile_money, bank_transfer, apple_pay
```

#### Step 3: Check Paystack Dashboard
- Dashboard → **Settings** → **Payment Methods**
- Verify **Apple Pay** shows as:
  - ✅ Enabled (if available)
  - 🔴 Disabled (needs enabling)
  - ⚠️ Unavailable (not supported for your region/currency)

#### Step 4: Test on Correct Device
- iOS/iPadOS Safari: Should show Apple Pay option
- macOS Safari: Should show Apple Pay option
- Android/Chrome: Won't show (expected)
- Desktop Safari: Won't show unless on macOS

---

### Implementation Details

**Current Configuration:**
```typescript
// Default channels (always available)
const channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];

// Apple Pay only if explicitly enabled
if (process.env.NEXT_PUBLIC_ENABLE_APPLE_PAY === 'true') {
  channels.push('apple_pay');
}
```

**To Enable Apple Pay:**
1. Set in `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_APPLE_PAY=true
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Verify in Paystack dashboard (Settings → Payment Methods)

---

### Paystack Documentation References

- **Payment Methods:** https://paystack.com/docs/payments/payment-method-enabled-by-default/
- **Apple Pay Support:** Contact Paystack support for current Apple Pay availability
- **Supported Currencies:** https://paystack.com/docs/payments/currencies/

---

### Alternative: Accept What's Currently Available

If Apple Pay isn't needed, current payment methods work great:
- ✅ Cards (Visa, Mastercard)
- ✅ Bank Transfers
- ✅ USSD
- ✅ QR Code
- ✅ Mobile Money (Mtn, Vodafone, AirtelTigo)

---

### Contact Paystack Support

If you want to enable Apple Pay:
1. Email: support@paystack.com
2. Include:
   - Your Paystack Business ID
   - Currency (GHS)
   - Request for Apple Pay enablement

---

## Environment Configuration

Add to `.env.local`:
```bash
# Only set to 'true' if Apple Pay is enabled in your Paystack account
NEXT_PUBLIC_ENABLE_APPLE_PAY=true
```

If not set or set to 'false', Apple Pay will not appear in the payment modal (default behavior).

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| Code Integration | ✅ Ready | Set env variable if needed |
| Browser Support | ✅ Auto-detected | Works on Safari iOS/Mac |
| Paystack Config | ❓ Check | Enable in dashboard or request |
| Currency Support | ❓ Check | Verify GHS support with Paystack |
| HTTPS Required | ✅ Configured | Working in production |

