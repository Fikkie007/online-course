import { describe, it, expect, vi } from 'vitest';

// Extract certificate number generation logic for testing
function generateCertificateNumber(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Extract slug generation logic from courses route
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Extract rate limiting logic from middleware
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function createRateLimiter() {
  const rateLimit = new Map<string, { count: number; lastRequest: number }>();

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimit.get(ip);

    if (!entry) {
      rateLimit.set(ip, { count: 1, lastRequest: now });
      return false;
    }

    if (now - entry.lastRequest > RATE_LIMIT_WINDOW) {
      rateLimit.set(ip, { count: 1, lastRequest: now });
      return false;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      return true;
    }

    entry.count++;
    entry.lastRequest = now;
    return false;
  }

  function getEntry(ip: string) {
    return rateLimit.get(ip);
  }

  return { isRateLimited, getEntry };
}

describe('Certificate Number Generator', () => {
  it('should generate certificate number with correct format', () => {
    const certNumber = generateCertificateNumber();

    expect(certNumber).toMatch(/^CERT-[A-Z0-9]+-[A-Z0-9]{4}$/);
  });

  it('should start with CERT prefix', () => {
    const certNumber = generateCertificateNumber();

    expect(certNumber.startsWith('CERT-')).toBe(true);
  });

  it('should generate unique certificate numbers', () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateCertificateNumber());
    }

    expect(numbers.size).toBe(100);
  });

  it('should have three parts separated by hyphens', () => {
    const certNumber = generateCertificateNumber();
    const parts = certNumber.split('-');

    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('CERT');
  });

  it('should have uppercase letters only', () => {
    const certNumber = generateCertificateNumber();

    expect(certNumber).toBe(certNumber.toUpperCase());
    expect(certNumber).not.toContain('a');
    expect(certNumber).not.toContain('b');
  });

  it('should generate random suffix of 4 characters', () => {
    const certNumber = generateCertificateNumber();
    const parts = certNumber.split('-');

    expect(parts[2].length).toBe(4);
  });
});

describe('Slug Generator', () => {
  it('should generate slug from simple title', () => {
    const slug = generateSlug('Introduction to Programming');

    expect(slug).toBe('introduction-to-programming');
  });

  it('should lowercase all characters', () => {
    const slug = generateSlug('HELLO World');

    expect(slug).toBe('hello-world');
  });

  it('should replace special characters with hyphens', () => {
    const slug = generateSlug('Course: Advanced Topics!');

    expect(slug).toBe('course-advanced-topics');
  });

  it('should remove leading and trailing hyphens', () => {
    const slug = generateSlug('!!!Hello World!!!');

    expect(slug).toBe('hello-world');
    expect(slug.startsWith('-')).toBe(false);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('should handle numbers in title', () => {
    const slug = generateSlug('JavaScript 101');

    expect(slug).toBe('javascript-101');
  });

  it('should handle multiple consecutive special characters', () => {
    const slug = generateSlug('Hello---World!!!');

    expect(slug).toBe('hello-world');
  });

  it('should handle empty string', () => {
    const slug = generateSlug('');

    expect(slug).toBe('');
  });

  it('should handle title with only special characters', () => {
    const slug = generateSlug('!!!@@@###');

    expect(slug).toBe('');
  });

  it('should preserve hyphens in title', () => {
    const slug = generateSlug('React - A JavaScript Library');

    expect(slug).toBe('react-a-javascript-library');
  });

  it('should handle unicode characters', () => {
    const slug = generateSlug('Kursus 中文 日本語');

    // Non-alphanumeric characters should be replaced
    expect(slug).not.toContain('中文');
    expect(slug).not.toContain('日本語');
  });
});

describe('Rate Limiter', () => {
  it('should not rate limit first request', () => {
    const limiter = createRateLimiter();

    expect(limiter.isRateLimited('192.168.1.1')).toBe(false);
  });

  it('should track request count', () => {
    const limiter = createRateLimiter();
    const ip = '10.0.0.1';

    limiter.isRateLimited(ip);
    limiter.isRateLimited(ip);

    const entry = limiter.getEntry(ip);
    expect(entry?.count).toBe(2);
  });

  it('should rate limit after max requests', () => {
    const limiter = createRateLimiter();
    const ip = '10.0.0.2';

    // Make RATE_LIMIT_MAX requests
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      limiter.isRateLimited(ip);
    }

    // Should be rate limited now
    expect(limiter.isRateLimited(ip)).toBe(true);
  });

  it('should reset after window expires', () => {
    const limiter = createRateLimiter();
    const ip = '10.0.0.3';

    // Fill up the limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      limiter.isRateLimited(ip);
    }

    // Should be limited
    expect(limiter.isRateLimited(ip)).toBe(true);

    // Manually expire the window by updating the timestamp
    const entry = limiter.getEntry(ip);
    if (entry) {
      entry.lastRequest = Date.now() - RATE_LIMIT_WINDOW - 1;
    }

    // Should not be limited after window expires
    expect(limiter.isRateLimited(ip)).toBe(false);
  });

  it('should track different IPs separately', () => {
    const limiter = createRateLimiter();

    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    // Make 50 requests from ip1
    for (let i = 0; i < 50; i++) {
      limiter.isRateLimited(ip1);
    }

    // Make 20 requests from ip2
    for (let i = 0; i < 20; i++) {
      limiter.isRateLimited(ip2);
    }

    expect(limiter.getEntry(ip1)?.count).toBe(50);
    expect(limiter.getEntry(ip2)?.count).toBe(20);
  });

  it('should not rate limit unknown IP', () => {
    const limiter = createRateLimiter();

    expect(limiter.getEntry('unknown-ip')).toBeUndefined();
  });

  it('should handle concurrent requests for same IP', () => {
    const limiter = createRateLimiter();
    const ip = '10.0.0.4';

    // Simulate rapid requests
    const results = [];
    for (let i = 0; i < RATE_LIMIT_MAX + 10; i++) {
      results.push(limiter.isRateLimited(ip));
    }

    // First RATE_LIMIT_MAX should be false, rest true
    const falseCount = results.filter((r) => r === false).length;
    const trueCount = results.filter((r) => r === true).length;

    expect(falseCount).toBe(RATE_LIMIT_MAX);
    expect(trueCount).toBe(10);
  });
});