# Online Course Platform

Platform kursus online dengan fitur lengkap untuk pembelajaran digital.

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v5 (Google OAuth + Email/Password)
- **Database**: Supabase (PostgreSQL + Storage)
- **Payment**: Midtrans Snap
- **WhatsApp**: Fonnte API
- **Email**: Resend
- **Queue**: BullMQ + Redis (Upstash)
- **Testing**: Vitest with v8 coverage
- **Security**: Google reCAPTCHA v3, bcrypt, CSP headers

## Features

### Authentication
- 🔐 **Multiple Auth Methods**
  - Google OAuth (one-click login)
  - Email/Password registration & login
  - Forgot password with email reset
  - Set password for Google users (enable email login)
- 🛡️ **Security**
  - Google reCAPTCHA v3 protection
  - Secure password hashing with bcrypt (12 rounds)
  - JWT session strategy (24-hour expiry)
  - Row Level Security (RLS) on database
  - Content Security Policy (CSP) headers
  - Rate limiting (100 req/min)
  - Cryptographically secure certificate numbers
  - XSS prevention in email templates

### Untuk Student
- 📚 Jelajahi katalog kursus dengan filter kategori
- 🎥 Akses materi video, dokumen (PDF, Office), dan quiz
- 📄 Preview dokumen langsung di browser (iframe + Google Docs Viewer)
- 📊 Track progress pembelajaran real-time
- 🏆 Dapatkan sertifikat digital setelah lulus
- 💳 Pembayaran via Midtrans (transfer, kartu, e-wallet)

### Untuk Mentor
- 📝 Buat dan kelola kursus dengan multi-kategori
- 📁 Upload materi (video, dokumen, gambar) ke Supabase Storage
- 🎬 Kelola modul dan pelajaran dengan drag-and-drop order
- 👨‍🏫 Lihat daftar siswa dan progress mereka
- 📈 Dashboard statistik pendapatan

### Untuk Admin
- 👥 Kelola user dan role
- 📋 Moderasi kursus
- 📦 Kelola kategori kursus
- 💰 Monitor transaksi
- 📤 Kirim notifikasi manual

## Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd online_course
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi semua variable yang diperlukan (lihat section Environment Variables).

### 3. Setup Supabase

1. Buat project di [Supabase](https://supabase.com)
2. Jalankan migrations di SQL Editor secara berurutan:

```sql
-- Jalankan semua file di folder supabase/migrations/
-- Atau jalankan satu peratu:
```

**Migration Files (jalankan berurutan):**
1. `001_initial_schema.sql` - Schema utama
2. `002_rls_policies.sql` - Row Level Security
3. `003_functions.sql` - Database functions
4. `004_fix_profiles_fk.sql` - Fix foreign key
5. `005_notifications_table.sql` - Notifikasi
6. `006_categories_table.sql` - Kategori
7. `007_course_categories_junction.sql` - Relasi kursus-kategori
8. `008_course_materials_storage.sql` - Storage bucket
9. `009_add_password_auth.sql` - Email/password auth
10. `010_password_reset_tokens.sql` - Reset password tokens
11. `011_secure_rls_policies.sql` - **CRITICAL** Secure RLS policies (replaces 002)
12. `012_performance_indexes.sql` - **RECOMMENDED** Composite indexes for performance

3. Copy project URL dan keys ke `.env.local`

### 4. Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat OAuth 2.0 credentials
3. Tambahkan authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

### 5. Setup Google reCAPTCHA

1. Buka [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Pilih reCAPTCHA v3
3. Tambahkan domain:
   - `localhost` (development)
   - `yourdomain.com` (production)
4. Copy Site Key dan Secret Key ke `.env.local`

### 6. Setup Resend (Email)

1. Daftar di [Resend](https://resend.com)
2. Buat API Key di [API Keys](https://resend.com/api-keys)
3. Untuk testing, gunakan `onboarding@resend.dev` sebagai sender
4. Untuk production, verifikasi domain Anda

```bash
# Testing
EMAIL_FROM=onboarding@resend.dev

# Production
EMAIL_FROM=Online Course <noreply@yourdomain.com>
```

### 7. Setup Midtrans

1. Daftar di [Midtrans](https://midtrans.com)
2. Dapatkan Server Key dan Client Key dari dashboard
3. Set notification URL: `https://yourdomain.com/api/webhooks/midtrans`

### 8. Jalankan Aplikasi

```bash
# Development
npm run dev

# Build production
npm run build
npm start

# Jalankan queue worker (membutuhkan Redis)
npm run worker

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Buka [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| **Supabase** | |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| **NextAuth** | |
| `NEXTAUTH_SECRET` | Secret untuk NextAuth (generate dengan `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL aplikasi (http://localhost:3000 untuk dev) |
| **Google OAuth** | |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| **reCAPTCHA** | |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key |
| **Midtrans** | |
| `MIDTRANS_IS_PRODUCTION` | Set `true` untuk production |
| `MIDTRANS_SERVER_KEY` | Midtrans Server Key |
| `MIDTRANS_CLIENT_KEY` | Midtrans Client Key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans Client Key (frontend) |
| **Email** | |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender email (e.g., `Online Course <noreply@domain.com>`) |
| **WhatsApp** | |
| `FONNTE_API_KEY` | Fonnte WhatsApp API key |
| **Queue** | |
| `REDIS_URL` | Redis URL (Upstash atau lainnya) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages
│   │   ├── login/           # Login page
│   │   ├── register/        # Register page
│   │   ├── forgot-password/ # Forgot password
│   │   ├── reset-password/  # Reset password
│   │   └── set-password/    # Set password for Google users
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── mentor/          # Mentor dashboard
│   │   └── student/         # Student dashboard
│   │       ├── courses/     # My courses
│   │       ├── certificates/# Certificates
│   │       └── notifications
│   ├── api/                 # API routes
│   │   ├── auth/            # Auth endpoints
│   │   │   ├── register/    # Email registration
│   │   │   ├── check-email/ # Check if email exists
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── set-password/
│   │   ├── courses/         # Course CRUD
│   │   ├── payments/        # Payment endpoints
│   │   ├── lessons/         # Lesson progress
│   │   ├── upload/          # File upload
│   │   └── webhooks/        # Midtrans webhook
│   ├── certificate/         # Public certificate page
│   └── courses/             # Course catalog
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   ├── SetPasswordForm.tsx
│   │   └── GoogleSignInButton.tsx
│   ├── course/              # Course components
│   │   ├── CourseCard.tsx
│   │   ├── ModuleManager.tsx
│   │   └── CompleteLessonButton.tsx
│   └── dashboard/           # Dashboard components
├── lib/
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── admin.ts         # Admin client (bypass RLS)
│   ├── auth/                # Auth helpers
│   │   ├── helpers.ts       # getCurrentUser, etc.
│   │   └── password.ts      # Hash & verify password
│   ├── midtrans/            # Midtrans client
│   ├── fonnte/              # WhatsApp client
│   ├── resend/              # Email client & templates
│   ├── queue/               # BullMQ queue
│   ├── certificate/         # Certificate generator
│   └── utils/               # Utilities (recaptcha, etc.)
├── types/                   # TypeScript types
└── hooks/                   # React hooks

supabase/
└── migrations/              # SQL migrations (001-011)

tests/
├── utils.test.ts            # Utility functions (cn)
├── password.test.ts         # Password hashing/verification
├── email-templates.test.ts  # Email templates (XSS-safe)
├── whatsapp-templates.test.ts # WhatsApp templates
├── certificate.test.ts      # Certificate/slug/rate-limiting
├── validation.test.ts       # Zod schema validation (57 tests)
├── types.test.ts            # TypeScript enums
├── recaptcha.test.ts        # ReCAPTCHA verification
└── api.integration.test.ts  # API endpoint tests (31 tests)

worker/
└── index.ts                 # Queue worker entry point
```

## API Endpoints

### Public
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/courses` | List published courses |
| GET | `/api/courses/:id` | Course detail |
| GET | `/api/categories` | List categories |
| GET | `/certificate/:number` | Verify certificate |

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/check-email` | Check if email exists |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/set-password` | Set password (Google users) |

### Student (Auth Required)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/courses/:id/enroll` | Enroll in course |
| POST | `/api/payments/create` | Create payment |
| POST | `/api/lessons/:id/complete` | Mark lesson complete |

### Mentor/Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/courses` | Create course |
| PATCH | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST | `/api/courses/:id/modules` | Add module |
| PATCH | `/api/courses/:id/modules/:mid` | Update module |
| DELETE | `/api/courses/:id/modules/:mid` | Delete module |
| POST | `/api/courses/:id/modules/:mid/lessons` | Add lesson |
| PATCH | `/api/courses/:id/modules/:mid/lessons/:lid` | Update lesson |
| DELETE | `/api/courses/:id/modules/:mid/lessons/:lid` | Delete lesson |
| POST | `/api/upload` | Upload file to storage |
| DELETE | `/api/upload` | Delete file from storage |

### Admin Only
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/admin/users/:id/role` | Update user role |
| GET | `/api/admin/users` | List all users |

### Webhooks
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/webhooks/midtrans` | Midtrans notification |

## User Roles

| Role | Permissions |
|------|-------------|
| `student` | Browse courses, enroll, learn, get certificates |
| `mentor` | Create/manage own courses, view students |
| `admin` | Full access to all features |

## Database Schema

### Tables

| Table | Deskripsi |
|-------|-----------|
| `profiles` | Data user (id, email, password_hash, role, etc.) |
| `courses` | Data kursus |
| `modules` | Modul dalam kursus |
| `lessons` | Pelajaran dalam modul |
| `enrollments` | Pendaftaran kursus |
| `lesson_progress` | Progress pelajaran |
| `payments` | Transaksi pembayaran |
| `certificates` | Sertifikat digital |
| `categories` | Kategori kursus |
| `course_categories` | Relasi kursus-kategori (many-to-many) |
| `notifications_log` | Log notifikasi |
| `password_reset_tokens` | Token reset password |

## Deployment

### Vercel (Frontend)

1. Push code ke GitHub
2. Import project di Vercel
3. Set semua environment variables
4. Deploy

### Railway/Render (Worker)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "run", "worker"]
```

### Supabase Configuration

1. Set Site URL di Authentication > URL Configuration
2. Tambahkan redirect URLs untuk OAuth
3. Create storage bucket: `course-materials`

## Common Issues

### Email not sending
- Check `RESEND_API_KEY` is correct
- For testing, `onboarding@resend.dev` only sends to your Resend account email
- Verify your domain for production

### Google login not creating profile
- Check Google OAuth credentials
- Verify redirect URI matches exactly
- Check terminal logs for `[Auth JWT]` messages

### Password reset not working
- Run migration `010_password_reset_tokens.sql`
- User must have `password_hash` (email/password users only)
- Google users need to set password first at `/set-password`

### File upload failing
- Run migration `008_course_materials_storage.sql`
- Check Supabase storage bucket exists
- Verify file size < 500MB
- Blocked extensions: php, jsp, exe, sh, svg, html

## Testing

This project has comprehensive test coverage with **207 tests** across 9 test files.

### Test Categories

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `validation.test.ts` | 57 | Zod schema validation |
| `api.integration.test.ts` | 31 | API endpoint behavior |
| `certificate.test.ts` | 28 | Certificate generation, rate limiting |
| `email-templates.test.ts` | 21 | Email templates, XSS prevention |
| `types.test.ts` | 21 | TypeScript enum definitions |
| `whatsapp-templates.test.ts` | 14 | WhatsApp message templates |
| `recaptcha.test.ts` | 14 | ReCAPTCHA v3 verification |
| `password.test.ts` | 11 | Password hashing/verification |
| `utils.test.ts` | 10 | Utility functions |

### Security Tests

The test suite includes security-specific tests:

- ✅ **IDOR Protection** - Payment ownership verification
- ✅ **Authentication** - Protected endpoints reject unauthenticated users
- ✅ **Authorization** - Admin endpoints reject non-admin users
- ✅ **Input Validation** - All schemas tested with invalid inputs
- ✅ **Password Strength** - 8+ chars, uppercase, lowercase, number required
- ✅ **Email Enumeration** - Forgot-password doesn't reveal email existence
- ✅ **Webhook Security** - Signature verification tested
- ✅ **XSS Prevention** - Email templates escape HTML

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test reports are generated in `TEST_REPORT.md`.

## Security

This platform implements defense-in-depth security measures:

### Authentication & Session
- Password policy: 8+ characters, uppercase, lowercase, number required
- bcrypt hashing with 12 rounds
- JWT session expiry: 24 hours (reduced from default 30 days)
- Google OAuth with profile verification

### Database Security
- Row Level Security (RLS) on all tables
- Service role only for writes (admin client)
- Application-layer ownership verification
- Anon key can only read published content

### API Security
- Rate limiting: 100 requests/minute (Redis-backed in production)
- Input validation with Zod schemas
- IDOR prevention on sensitive endpoints
- Webhook idempotency (prevents duplicate processing)

### File Upload Security
- Magic bytes validation (file signature verification)
- Blocked dangerous extensions (php, jsp, exe, sh, svg)
- Cryptographically secure random filenames
- Path traversal prevention
- 500MB size limit

### Headers & CSP
- Content-Security-Policy (CSP) with Midtrans integration
- X-Frame-Options: DENY (clickjacking prevention)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS) in production
- Referrer-Policy: strict-origin-when-cross-origin

### Certificates
- Cryptographically secure certificate numbers (crypto.randomBytes)
- Timestamp + random bytes for uniqueness
- Public verification endpoint

See `SECURITY_AUDIT_REPORT.md`, `SECURITY_FIXES_APPLIED.md`, and `SECURITY_REVIEW_REPORT.md` for detailed security documentation.

## License

MIT License