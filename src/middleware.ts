import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

// Use Redis for production, fallback to in-memory for development
let redisClient: any = null;

async function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis');
      redisClient = new Redis(process.env.REDIS_URL);
    } catch (e) {
      console.warn('Redis connection failed, using in-memory rate limiting');
    }
  }
  return redisClient;
}

// In-memory fallback for rate limiting
const memoryRateLimit = new Map<string, { count: number; lastRequest: number }>();

async function isRateLimited(ip: string): Promise<boolean> {
  const redis = await getRedisClient();

  if (redis) {
    // Use Redis for distributed rate limiting
    const key = `ratelimit:${ip}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000));
    }

    return current > RATE_LIMIT_MAX;
  } else {
    // Fallback to in-memory rate limiting
    const now = Date.now();
    const entry = memoryRateLimit.get(ip);

    if (!entry) {
      memoryRateLimit.set(ip, { count: 1, lastRequest: now });
      return false;
    }

    if (now - entry.lastRequest > RATE_LIMIT_WINDOW) {
      memoryRateLimit.set(ip, { count: 1, lastRequest: now });
      return false;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      return true;
    }

    entry.count++;
    entry.lastRequest = now;
    return false;
  }
}

// Security headers configuration
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // XSS protection (legacy but still useful for older browsers)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (restrict browser features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  // Content Security Policy - adjust as needed for your app
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.sandbox.midtrans.com https://api.midtrans.com https://www.google.com",
    "frame-src https://app.sandbox.midtrans.com https://app.midtrans.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

// Add HSTS in production
if (process.env.NODE_ENV === 'production') {
  (securityHeaders as any)['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.ip ||
             'unknown';

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Skip rate limiting for webhooks (they have their own verification)
    if (!request.nextUrl.pathname.startsWith('/api/webhooks')) {
      if (await isRateLimited(ip)) {
        return NextResponse.json(
          { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }
  }

  // Get session cookie (NextAuth v5 uses 'authjs.session-token')
  const sessionCookie = request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  const isAuthenticated = !!sessionCookie?.value;

  // Route protection based on role
  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ['/login', '/register', '/courses', '/', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Auth routes - redirect authenticated users
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/student', request.url));
    }
    const response = NextResponse.next();
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Protected dashboard routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Role check will be done in the page component
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (pathname.startsWith('/mentor')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};