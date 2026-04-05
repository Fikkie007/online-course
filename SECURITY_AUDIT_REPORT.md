# 🔒 Security Audit Report - Online Course Platform

**Date:** 2026-04-05
**Auditor:** Security Engineer Mode (Claude Code)
**Severity Scale:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🔵 LOW | ⚪ INFO

---

## Executive Summary

**Overall Risk Level: 🟠 HIGH**

This application has several critical security vulnerabilities that must be addressed before production deployment. The most severe issues relate to Row Level Security (RLS) policies being completely permissive, potential IDOR vulnerabilities, and debug information leakage.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Row Level Security (RLS) is Effectively Disabled

**File:** `supabase/migrations/002_rls_policies.sql`

**Finding:** All RLS policies use `WITH CHECK (true)` and `USING (true)`, meaning:
- Any user can read ALL data from ALL tables
- Any user can INSERT/UPDATE/DELETE any record
- No row-level access control exists

**Impact:** Complete data exposure. Any user with the anon key can:
- Read all users' personal information (email, phone)
- View all payments and transactions
- Modify any course, enrollment, or certificate
- Access other users' progress data

**Example from code:**
```sql
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE USING (true);
CREATE POLICY "payments_select_all" ON payments FOR SELECT USING (true);
```

**Remediation:**
```sql
-- Example: Users should only read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.jwt() ->> 'sub');

-- Payments should only be visible to the student involved
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (student_id = auth.jwt() ->> 'sub');
```

**Note:** Since you use NextAuth instead of Supabase Auth, `auth.uid()` is not available. You need to either:
1. Pass user ID through custom claims/JWT, or
2. Use a different authorization approach at the application layer

---

### 2. IDOR (Insecure Direct Object Reference) Vulnerabilities

**Files:** Multiple API routes

**Finding:** Several endpoints lack proper ownership verification.

#### 2.1 Payment Status Endpoint
**File:** `src/app/api/payments/status/route.ts`

The endpoint checks if user is authenticated but doesn't verify they own the payment:
```typescript
// Missing: verify payment belongs to requesting user
const { data: payment } = await supabase
  .from('payments')
  .select('*')
  .eq('midtrans_order_id', orderId)
  .single();
```

**Attack:** Any authenticated user can query any payment by order_id.

#### 2.2 Notification Read Endpoint
**File:** `src/app/api/notifications/[notificationId]/read/route.ts`

The endpoint doesn't verify the notification belongs to the requesting user:
```typescript
await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
// Missing: .eq('user_id', user.id)
```

**Attack:** Any user can mark any notification as read.

#### 2.3 Lesson Completion
**File:** `src/app/api/lessons/[lessonId]/complete/route.ts`

While enrollment is checked, a malicious user could potentially complete lessons for courses they shouldn't have access to if the enrollment check is bypassed.

---

### 3. Debug Information Leakage in Production

**File:** `src/app/api/auth/forgot-password/route.ts` (lines 116-121)

**Finding:** Error details are returned to the client:
```typescript
return NextResponse.json({
  success: false,
  error: `Gagal mengirim email: ${JSON.stringify(emailResult.error)}`,
  debug: process.env.NODE_ENV === 'development',
});
```

**Impact:** Exposes internal error details, API keys structure, service configuration.

**Remediation:** Never return internal errors to clients. Log server-side only.

---

## 🟠 HIGH VULNERABILITIES

### 4. File Upload - Potential Malicious File Execution

**File:** `src/app/api/upload/route.ts`

**Issues:**
1. File type validation relies solely on MIME type from `file.type`, which can be spoofed
2. No virus/malware scanning
3. Files are stored with public read access
4. Filename is predictable (timestamp + 6 char random)

**Attack Vectors:**
- Upload a PHP/JSP webshell disguised as an image
- Upload malicious PDF with embedded JavaScript
- Upload HTML files with XSS payloads

**Remediation:**
```typescript
// 1. Check file signature/magic bytes
const magicBytes = buffer.slice(0, 4);
const validSignatures = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};
// Validate actual file content matches claimed type

// 2. Generate cryptographically random filename
const crypto = require('crypto');
const randomName = crypto.randomBytes(16).toString('hex');

// 3. Strip executable permissions
// 4. Consider scanning with ClamAV or similar
```

---

### 5. Missing CSRF Protection for State-Changing Operations

**Finding:** While Next.js API routes are protected by same-origin policy, the following are concerns:

1. **Admin Role Change** (`src/app/api/admin/users/[userId]/role/route.ts`)
   - Uses POST with FormData (no CSRF token)
   - Any admin who visits a malicious site could have their session used to change user roles

2. **File Deletion** (`src/app/api/upload/route.ts` DELETE)
   - DELETE endpoint accepts JSON body with path
   - Could be triggered by malicious site

**Remediation:**
- Implement CSRF tokens for sensitive operations
- Use SameSite=Strict cookies where possible
- Require re-authentication for critical operations

---

### 6. Sensitive Data in Console Logs

**Files:** Multiple

**Finding:** Verbose logging in production code:
```typescript
// src/auth.ts:149
console.log('[Auth Session] Session created:', { id: token.id, role: token.role });

// src/app/api/auth/set-password/route.ts:32
console.log('[Set Password] Password validated, length:', password.length);
```

**Impact:**
- User IDs logged (privacy concern)
- Request patterns visible in logs
- In production with log aggregation, this could expose user data

**Remediation:** Remove all console.log statements or use a proper logging library with log levels.

---

### 7. Password Hash Column Exposed in Queries

**Files:** Multiple auth routes

**Finding:** `password_hash` is selected in queries where it shouldn't be:
```typescript
// src/app/api/auth/check-email/route.ts:19
.select('id, email, password_hash')
```

While not returned to client (line 36 only returns `hasPassword: !!user.password_hash`), this is:
1. Unnecessary data transfer
2. Risk if the return object is accidentally modified
3. Could leak in error responses

**Remediation:**
```typescript
.select('id, email') // Only select what you need
// Or use a computed column:
.select('id, email, has_password:password_hash.is_not_null()')
```

---

## 🟡 MEDIUM VULNERABILITIES

### 8. Rate Limiting Uses In-Memory Storage

**File:** `src/middleware.ts`

**Finding:** Rate limiting uses a JavaScript Map:
```typescript
const rateLimit = new Map<string, { count: number; lastRequest: number }>();
```

**Issues:**
1. Resets on server restart
2. Doesn't work in serverless/multi-instance deployments
3. Can be bypassed by distributing requests across time

**Remediation:** Use Redis (already configured for BullMQ) for distributed rate limiting.

---

### 9. Midtrans Webhook - No Idempotency Handling

**File:** `src/app/api/webhooks/midtrans/route.ts`

**Finding:** Webhook doesn't check if payment was already processed:
```typescript
// Updates payment without checking current status
await supabase
  .from('payments')
  .update(updateData)
  .eq('id', payment.id);
```

**Impact:** Duplicate webhooks could:
- Update course statistics multiple times
- Send duplicate notifications
- Cause race conditions

**Remediation:**
```typescript
// Only update if current status is 'pending'
const { data: updated } = await supabase
  .from('payments')
  .update(updateData)
  .eq('id', payment.id)
  .eq('status', 'pending') // Idempotency check
  .select();
```

---

### 10. No Content Security Policy (CSP)

**Finding:** No CSP headers are set in the application.

**Impact:**
- XSS attacks have higher impact
- No control over external resources
- Inline scripts and eval() are allowed

**Remediation:** Add CSP headers in `next.config.js` or middleware.

---

### 11. Missing Security Headers

**Finding:** The following security headers are not implemented:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `SAMEORIGIN`)
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

**Remediation:** Add in middleware or `next.config.js`.

---

### 12. Email Templates - Potential XSS

**Files:** `src/lib/resend/templates.ts`, `src/lib/fonnte/templates.ts`

**Finding:** User input is interpolated directly into HTML without sanitization:
```typescript
<p style="font-size: 18px;">Halo <strong>${name}</strong>,</p>
```

**Attack:** If `name` contains HTML: `<img src=x onerror=alert(1)>`, it will execute in email clients that support JavaScript (rare but possible).

**Remediation:** HTML-encode all user inputs:
```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

## 🔵 LOW VULNERABILITIES

### 13. JWT Strategy - No Token Expiration Configured

**File:** `src/auth.ts`

**Finding:** JWT session strategy is used but no explicit `maxAge` is configured:
```typescript
session: {
  strategy: 'jwt',
},
```

**Impact:** Default NextAuth JWT expiration is used (30 days). Stolen tokens remain valid for this period.

**Remediation:**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 24 * 60 * 60, // 1 day
},
```

---

### 14. Password Policy Too Weak

**File:** `src/app/api/auth/register/route.ts`

**Finding:** Password validation only checks minimum length of 6:
```typescript
password: z.string().min(6, 'Password minimal 6 karakter'),
```

**Remediation:** Implement stronger password policy:
- Minimum 8 characters
- Require uppercase, lowercase, number, and special character
- Check against common password lists

---

### 15. Certificate Number Predictability

**File:** `src/lib/certificate/generator.ts`

**Finding:** Certificate number generation uses:
```typescript
const timestamp = Date.now().toString(36).toUpperCase();
const random = Math.random().toString(36).substring(2, 6).toUpperCase();
```

**Issues:**
- `Math.random()` is not cryptographically secure
- Timestamp is predictable
- Only 4 random characters

**Remediation:**
```typescript
const crypto = require('crypto');
const random = crypto.randomBytes(4).toString('hex').toUpperCase();
```

---

### 16. No Input Sanitization for Course Content

**Finding:** Course descriptions, titles, and lesson content are not sanitized before storage or display.

**Impact:** Stored XSS if admin/mentor inputs malicious content.

**Remediation:** Use a library like `DOMPurify` or `sanitize-html`.

---

## ⚪ INFORMATIONAL

### 17. Environment Variable Naming Convention

Some secrets use `NEXT_PUBLIC_` prefix which exposes them to the client:
- `NEXT_PUBLIC_SUPABASE_URL` - OK (public info)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - OK (anon key is public)
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - OK (client key is public)

**Good:** Server-only secrets don't have `NEXT_PUBLIC_` prefix.

---

### 18. Supabase Storage Bucket is Public

**File:** `supabase/migrations/008_course_materials_storage.sql`

**Finding:** Storage bucket `course-materials` is created as public:
```sql
INSERT INTO storage.buckets (id, name, public, ...)
VALUES ('course-materials', 'course-materials', true, ...)
```

**Impact:** Anyone with the URL can access any uploaded file without authentication.

**Recommendation:** Consider if this is intended behavior. For paid courses, materials should require authentication.

---

## Remediation Priority

| Priority | Vulnerability | Effort |
|----------|---------------|--------|
| 1 | Fix RLS Policies | High |
| 2 | Fix IDOR vulnerabilities | Medium |
| 3 | Remove debug info leakage | Low |
| 4 | Improve file upload security | Medium |
| 5 | Add CSRF protection | Medium |
| 6 | Remove console logs | Low |
| 7 | Add security headers | Low |
| 8 | Implement proper logging | Medium |
| 9 | Add webhooks idempotency | Low |
| 10 | Strengthen password policy | Low |

---

## Quick Wins (Can be done immediately)

1. **Remove debug error messages** in `forgot-password/route.ts`
2. **Remove console.log statements** across the codebase
3. **Add security headers** in middleware
4. **Fix IDOR** by adding user ownership checks to queries
5. **Use crypto.randomBytes** for certificate generation

---

## Pre-Production Checklist

- [ ] All RLS policies properly restrict access
- [ ] IDOR vulnerabilities fixed
- [ ] Debug logging removed
- [ ] Security headers implemented
- [ ] File upload validation improved
- [ ] CSRF protection for sensitive operations
- [ ] Rate limiting uses Redis
- [ ] Webhook idempotency implemented
- [ ] Password policy strengthened
- [ ] CSP headers configured
- [ ] Error handling doesn't leak info
- [ ] All secrets properly configured in production
- [ ] HTTPS enforced
- [ ] Database backups configured

---

**Report Generated by Security Engineer Mode - Claude Code**
**Do not deploy to production without addressing CRITICAL and HIGH findings.**