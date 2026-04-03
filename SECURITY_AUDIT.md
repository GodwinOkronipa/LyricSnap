# 🔒 Security Audit Report - LyricSnap
**Date:** April 3, 2026  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## EXECUTIVE SUMMARY
Found **11 critical/high-severity issues** across authentication and payment flows. Most critical issues involve missing server-side verification and client-side security shortcuts that could enable fraud and unauthorized access.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Payment Verification (Server-Side)**
**Location:** `components/LyricSnapClient.tsx` lines 198-225  
**Risk:** User can manipulate payment success without actual payment  

**Problem:**
```typescript
const onSuccess = (reference: any) => {
  // ❌ No verification that payment actually succeeded
  updateProStatus(user.id);  // Direct DB update!
};
```

**Impact:** Any user can upgrade to Pro without paying by intercepting the success callback.

**Fix:** Implement server-side payment verification

---

### 2. **Hardcoded Admin Emails in Client Code**
**Location:** `components/LyricSnapClient.tsx` line 22, `AuthModal.tsx`  
**Risk:** Exposed to tampering; password reset could elevate to admin  

**Problem:**
```typescript
const ADMIN_EMAILS = ['godwinokro2020@gmail.com'];  // ❌ Client-side constant
if (ADMIN_EMAILS.includes(currentUser.email!)) {
  setIsPro(true);  // Anyone can see this logic!
}
```

**Impact:** 
- Users could claim admin status via account takeover
- Email enumeration attacks possible

---

### 3. **Weak Password Requirements**
**Location:** `app/reset-password/page.tsx` line 56  
**Risk:** Passwords can be bruteforced easily  

**Problem:**
```typescript
minLength={6}  // ❌ Only 6 characters
```

**Recommendation:** Enforce minimum 12 characters, complexity requirements

---

### 4. **Insecure Session State in LocalStorage**
**Location:** `components/LyricSnapClient.tsx` line 34  
**Risk:** Attacker can forge pending payment state  

**Problem:**
```typescript
localStorage.setItem('pending_pro_activation', 'true');
localStorage.getItem('pending_pro_activation');  // ❌ No integrity check
```

---

### 5. **Payment Amount Not Verified Server-Side**
**Location:** `components/LyricSnapClient.tsx` line 199  
**Risk:** Client could send $0.01 instead of $0.49  

**Problem:**
```typescript
const paystackAmount = (0.49 * Number(process.env.NEXT_PUBLIC_GHS_CONVERSION_RATE || 15) * 100);
// ❌ This value never verified by server
```

---

## 🟠 HIGH SEVERITY ISSUES

### 6. **No CSRF Protection on State-Changing Operations**
**Location:** All API routes  
**Risk:** Cross-site request forgery attacks possible  

**Missing:** CSRF tokens on:
- `POST` payment callbacks
- Profile updates
- Pro status upgrades

---

### 7. **No Rate Limiting on Auth Endpoints**
**Location:** `components/AuthModal.tsx`, `/auth/callback`  
**Risk:** Brute force attacks on password reset/login  

**Affected Routes:**
- Email/password signup (no rate limit)
- Password reset (no limit on attempts)
- Login attempts (no limit on failures)

---

### 8. **Guest Payment Flow Orphaned Transactions**
**Location:** `components/LyricSnapClient.tsx` lines 206-209  
**Risk:** Guest completes payment, account creation fails = lost money  

```typescript
if (!user) {
  setPendingProActivation(true);
  // ❌ User account might never be created
  setShowAuthModal(true);
}
```

**Impact:** Unable to track which user a payment belongs to

---

### 9. **Middleware Auth Bypass on Protected Routes**
**Location:** `lib/middleware.ts` lines 41-48  
**Risk:** Routes not in `/auth` aren't protected; middleware insufficient  

**Problem:**
```typescript
if (
  !user &&
  !request.nextUrl.pathname.startsWith('/login') &&
  !request.nextUrl.pathname.startsWith('/auth')
) {
  // PROBLEM: Only redirects to login, doesn't prevent processing
}
```

**Missing Routes:** `/api/generate`, `/api/search` have no auth checks

---

### 10. **No Content Security Policy Headers**
**Location:** `next.config.ts`  
**Risk:** XSS attacks possible; can steal tokens  

**Missing:**
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 11. **No HTTPS Enforcement**
**Location:** `next.config.ts`  
**Risk:** Man-in-the-middle attacks on unencrypted connections  

**Missing:** Forced HTTPS redirect, HSTS headers

---

## 🟡 MEDIUM SEVERITY ISSUES

### 12. **Email Address Not Validated in Paystack Config**
Location: `components/PaystackButton.tsx` line 28
```typescript
email: user?.email || "guest@lyricsnap.app"  // ❌ No validation
```
Risk: Invalid email could cause Paystack reject or bounce

### 13. **No Audit Logging for Auth Events**
Location: Auth modal, reset password  
Risk: No trail of login attempts, password resets, suspicious activity

### 14. **localStorage Timer Token Not Secured**
Location: `components/LyricSnapClient.tsx` lines 172-188
```typescript
const timerKey = 'lyric_snap_timer_end';
localStorage.setItem(timerKey, endTime);  // ❌ User can manipulate timer
```

### 15. **No Request Validation for API Calls**
Location: `/api/generate`, `/api/search`
Risk: No input sanitization on `title`, `artist`, `artwork` parameters

---

## ✅ RECOMMENDATIONS & FIXES IMPLEMENTED

### Priority 1 (Implement Immediately):
- ✅ Add server-side payment verification endpoint
- ✅ Move admin email check to server-side only
- ✅ Increase password requirements to 12+ chars
- ✅ Add CSRF token generation and validation
- ✅ Implement rate limiting middleware
- ✅ Add security headers to next.config.ts
- ✅ Create server-side payment verification API

### Priority 2 (Implement Soon):
- Implement audit logging for auth events
- Add request validation/sanitization for API inputs
- Implement 2FA support (optional but recommended)
- Add comprehensive error handling without info disclosure

### Priority 3 (Nice to Have):
- IP-based rate limiting
- Device fingerprinting for suspicious activity detection
- Webhook event signing verification

---

## Testing Checklist

- [ ] Test payment verification with fake/intercepted success
- [ ] Test admin email claim without actual admin privileges  
- [ ] Verify rate limiting blocks brute force attempts
- [ ] Confirm CSP headers prevent XSS injection
- [ ] Test HTTPS enforcement
- [ ] Verify guest payment flow completes to account creation
- [ ] Check Paystack webhook signature validation
- [ ] Test CSRF token validation on state changes

