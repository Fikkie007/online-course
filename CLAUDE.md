# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run worker        # Start queue worker (requires Redis)
npm run test          # Run tests once (Vitest)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Architecture Overview

### Tech Stack
- **Next.js 14** with App Router
- **Supabase** for database (PostgreSQL) and file storage
- **NextAuth v5** for authentication (Google OAuth + Email/Password, JWT strategy)
- **Midtrans** for payments
- **BullMQ + Redis** for async job processing (notifications)
- **Resend** for emails, **Fonnte** for WhatsApp
- **bcryptjs** for password hashing

### Authentication Flow

**Two auth methods supported:**
1. **Google OAuth** - Users sign in via Google, profile created with Google's `sub` as ID
2. **Email/Password** - Users register with email/password, ID generated as `cred_<timestamp>_<random>`

**Auth flow in `src/auth.ts`:**
1. On Google login, check if profile exists by `profile.sub` or by email (fallback)
2. Create new profile if not found, update if exists
3. Session includes `user.id` and `user.role` via JWT callbacks

**Important:**
- JWT callback uses `createAdminClient()` to bypass RLS
- `profiles.id` uses `TEXT` (not `UUID`) to support both NextAuth Google `sub` and generated IDs
- NextAuth v5 uses `authjs.session-token` cookie

**Auth Helpers (`src/lib/auth/helpers.ts`):**
- `getCurrentUser()` - Get current session user
- `isAdmin()`, `isMentor()`, `isStudent()` - Role checks
- `requireRole(roles)` - Throw if unauthorized

**Password utilities (`src/lib/auth/password.ts`):**
- `hashPassword(password)` - Hash with bcrypt
- `verifyPassword(password, hash)` - Compare password

### Database Clients (src/lib/supabase/)

| Client | Use Case | RLS |
|--------|----------|-----|
| `client.ts` | Browser, public reads | Yes |
| `server.ts` | Server-side SSR | Yes |
| `admin.ts` | Server-side writes | Bypassed |

**Always use admin client for writes** since `auth.uid()` is not available (we use NextAuth, not Supabase Auth).

### User Roles

Defined in `src/types/index.ts`:
- `student` - Browse, enroll, learn
- `mentor` - Create/manage own courses
- `admin` - Full access

### Route Protection (src/middleware.ts)
- `/admin/*` - Admin role required
- `/mentor/*` - Mentor or admin role required
- `/student/*` - Authentication required
- `/set-password`, `/forgot-password`, `/reset-password` - Public

### Course Structure

```
Course (multi-category via course_categories junction table)
├── Module (has order_index)
│   └── Lesson (has order_index, content_type, is_preview)
│       └── content_url (video, document, or quiz URL)
```

**Content Types:**
- `video` - YouTube, Vimeo, or direct video URL
- `document` - PDF, images, Office docs (rendered inline with iframe/Google Docs Viewer)
- `quiz` - External quiz URL

**File Upload:** Course materials uploaded to Supabase Storage bucket `course-materials` via `/api/upload`. Max 500MB.

### Payment Flow

1. User clicks "Buy" → `POST /api/payments/create`
2. Creates enrollment (pending) + payment record + Midtrans token
3. Frontend opens Midtrans Snap popup
4. Midtrans webhook → `POST /api/webhooks/midtrans`
5. Webhook updates payment + enrollment, triggers notifications

### Notification Queue

- With Redis: Jobs queued via `src/lib/queue/jobs.ts`, processed by `worker/index.ts`
- Without Redis: Fallback to synchronous sending

### Key Patterns

**API Response Format:**
```typescript
{ success: boolean, data?: T, error?: string }
```

**Supabase Query with Relations:**
```typescript
supabase.from('courses').select(`
  *,
  mentor:profiles!courses_mentor_id_fkey(id, full_name),
  categories:course_categories(category:categories(*))
`)
```

**Zod Validation:** All API inputs use Zod schemas. Zod v4 uses `error.issues` not `error.errors`.

**Client Component for Interactivity:**
Server Components can't have event handlers. Create client components with `'use client'` for onClick, useState, etc.

```typescript
// ❌ Wrong - Server Component with onClick
export default async function Page() {
  return <Button onClick={() => {}}>Click</Button>
}

// ✅ Correct - Client Component
'use client'
export function MyButton() {
  return <Button onClick={() => {}}>Click</Button>
}
```

### Security Patterns

**IDOR Prevention:**
Always verify ownership before returning sensitive data:
```typescript
// Get payment and verify ownership
const { data: payment } = await supabase
  .from('payments')
  .select('id, student_id, status')
  .eq('midtrans_order_id', orderId)
  .single();

if (payment.student_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Webhook Idempotency:**
Use status check to prevent duplicate processing:
```typescript
// Only update if status is 'pending'
const { data: updated } = await supabase
  .from('payments')
  .update(updateData)
  .eq('id', payment.id)
  .eq('status', 'pending') // IDEMPOTENCY KEY
  .maybeSingle();

if (!updated) {
  // Already processed - safe to acknowledge
  return NextResponse.json({ success: true, note: 'Already processed' });
}
```

**File Upload Security:**
```typescript
// 1. Check extension blocklist
const BLOCKED_EXTENSIONS = ['php', 'jsp', 'exe', 'sh', 'svg', 'html'];
if (BLOCKED_EXTENSIONS.includes(extension)) return error;

// 2. Validate MIME type whitelist
const allowedTypes = ['image/jpeg', 'application/pdf', 'video/mp4'];

// 3. Verify magic bytes (file signature)
const signature = FILE_SIGNATURES[file.type];
if (!validateFileSignature(buffer, file.type)) return error;

// 4. Use crypto.randomBytes for filename
const randomBytes = crypto.randomBytes(16).toString('hex');
```

**XSS Prevention in Templates:**
```typescript
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Password Validation:**
```typescript
// Regex: 8+ chars, uppercase, lowercase, number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
```

### Testing Patterns

**Test Structure:**
Tests are located in `tests/` directory, mirroring the source structure.

**Mocking Supabase:**
```typescript
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

// Create chainable mock
mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
};
vi.mocked(supabase.createAdminClient).mockReturnValue(mockSupababaseClient);
```

**Mocking Auth:**
```typescript
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn(),
  isMentor: vi.fn(),
}));

vi.mocked(auth.getCurrentUser).mockResolvedValue({
  id: 'user-123',
  email: 'test@example.com',
  role: 'student',
});
```

**API Request Helper:**
```typescript
function createRequest(body: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}
```

**Security Test Example:**
```typescript
it('should prevent IDOR - user can only check own payments', async () => {
  mockSupabaseClient.single.mockResolvedValueOnce({
    data: { id: 'pay-1', student_id: 'other-user', status: 'pending' },
    error: null,
  });

  const response = await GET(request);
  expect(response.status).toBe(403); // Forbidden, not 404
});
```

### Database Migrations

Run in order in Supabase SQL Editor:

| # | File | Purpose |
|---|------|---------|
| 001 | `initial_schema.sql` | All tables |
| 002 | `rls_policies.sql` | Row Level Security (replaced by 011) |
| 003 | `functions.sql` | DB functions |
| 004 | `fix_profiles_fk.sql` | NextAuth compatibility |
| 005 | `notifications_table.sql` | Notifications log |
| 006 | `categories_table.sql` | Categories |
| 007 | `course_categories_junction.sql` | Many-to-many |
| 008 | `course_materials_storage.sql` | Storage bucket |
| 009 | `add_password_auth.sql` | Password column |
| 010 | `password_reset_tokens.sql` | Reset tokens |
| 011 | `secure_rls_policies.sql` | **CRITICAL** Secure RLS (replaces 002) |

### Email Templates

Located in `src/lib/resend/templates.ts`:
- `welcomeEmailTemplate` - New user welcome
- `enrollmentSuccessEmailTemplate` - Course enrollment
- `courseCompletionEmailTemplate` - Certificate earned
- `passwordResetEmailTemplate` - Password reset link

**Email sender configured via `EMAIL_FROM` env var.** For testing, use `onboarding@resend.dev` (only sends to your Resend account email).

### Type Definitions

All types in `src/types/index.ts`. Extend with relations using intersection types:

```typescript
import { Course } from '@/types';

type CourseWithMentor = Course & {
  mentor: { id: string; full_name: string | null };
};
```

### Environment Variables

Key variables (see `.env.example` for full list):
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations (secret!)
- `NEXTAUTH_SECRET` - JWT signing
- `RESEND_API_KEY` - Email sending
- `EMAIL_FROM` - Sender email address
- `REDIS_URL` - Queue system (optional)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` - Spam protection

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->