import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreate schemas from API routes for testing
// Password strength regex: min 8 chars, uppercase, lowercase, number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(passwordRegex, 'Password harus mengandung huruf besar, huruf kecil, dan angka'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  recaptchaToken: z.string().optional(),
});

const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  price: z.number().min(0).default(0),
  discount_price: z.number().min(0).optional().nullable(),
  duration_hours: z.number().int().min(0).optional().nullable(),
});

// Password reset schema (matches reset-password/route.ts)
const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token diperlukan'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(passwordRegex, 'Password harus mengandung huruf besar, huruf kecil, dan angka'),
  recaptchaToken: z.string().optional(),
});

describe('Register Schema Validation', () => {
  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email tidak valid');
      }
    });

    it('should reject missing email', () => {
      const result = registerSchema.safeParse({
        password: 'Password123',
      });

      expect(result.success).toBe(false);
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'user123@test-domain.org',
      ];

      validEmails.forEach((email) => {
        const result = registerSchema.safeParse({
          email,
          password: 'Password123',
        });
        expect(result.success).toBe(true);
      });
    });

    // NEW: Edge cases for email
    it('should reject email with multiple @ symbols', () => {
      const result = registerSchema.safeParse({
        email: 'user@@domain.com',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = registerSchema.safeParse({
        email: 'user@',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
    });

    it('should accept email with subdomain', () => {
      const result = registerSchema.safeParse({
        email: 'user@mail.subdomain.example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('password validation', () => {
    it('should accept password with 8+ chars, uppercase, lowercase, number', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Pass1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password minimal 8 karakter');
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'PASSWORD123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'PasswordOnly',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
    });

    it('should accept long passwords with required complexity', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'A' + 'a'.repeat(98) + '1', // Uppercase, lowercase, number, 100 chars
      });

      expect(result.success).toBe(true);
    });

    // NEW: Password with special characters
    it('should accept password with special characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'P@ssw0rd!#$%',
      });

      expect(result.success).toBe(true);
    });

    // NEW: Boundary test - exactly 8 chars
    it('should accept password with exactly 8 characters meeting all requirements', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Passwo12', // 8 chars, uppercase, lowercase, numbers
      });

      expect(result.success).toBe(true);
    });

    // NEW: Password with only spaces (should fail)
    it('should reject password with only spaces', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '        ', // 8 spaces
      });

      expect(result.success).toBe(false);
    });

    // NEW: Password with leading/trailing spaces
    it('should accept password with valid complexity (spaces are part of password)', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: ' Password1 ', // Has spaces but meets requirements
      });

      expect(result.success).toBe(true);
    });
  });

  describe('fullName validation (optional)', () => {
    it('should accept valid fullName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'John Doe',
      });

      expect(result.success).toBe(true);
    });

    it('should accept missing fullName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject fullName shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'J',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nama minimal 2 karakter');
      }
    });

    // NEW: fullName with special characters
    it('should accept fullName with special characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        fullName: "O'Brien-Smith",
      });

      expect(result.success).toBe(true);
    });

    // NEW: fullName with unicode
    it('should accept fullName with unicode characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'José García',
      });

      expect(result.success).toBe(true);
    });

    // NEW: XSS attempt in fullName (schema should accept, but app should sanitize)
    it('should accept fullName (XSS prevention is app-layer responsibility)', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        fullName: '<script>alert("xss")</script>',
      });

      // Schema accepts it - sanitization should happen at display time
      expect(result.success).toBe(true);
    });
  });

  describe('recaptchaToken validation (optional)', () => {
    it('should accept valid recaptchaToken', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        recaptchaToken: 'some-token-string',
      });

      expect(result.success).toBe(true);
    });

    it('should accept missing recaptchaToken', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('Password Reset Schema Validation', () => {
  it('should accept valid reset request', () => {
    const result = passwordResetSchema.safeParse({
      token: 'valid-token-123',
      password: 'NewPassword123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing token', () => {
    const result = passwordResetSchema.safeParse({
      password: 'NewPassword123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty token', () => {
    const result = passwordResetSchema.safeParse({
      token: '',
      password: 'NewPassword123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject weak password in reset', () => {
    const result = passwordResetSchema.safeParse({
      token: 'valid-token-123',
      password: 'weak',
    });

    expect(result.success).toBe(false);
  });
});

describe('Course Schema Validation', () => {
  describe('title validation', () => {
    it('should accept valid title', () => {
      const result = createCourseSchema.safeParse({
        title: 'Introduction to Programming',
      });

      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 3 characters', () => {
      const result = createCourseSchema.safeParse({
        title: 'AB',
      });

      expect(result.success).toBe(false);
    });

    it('should reject title longer than 200 characters', () => {
      const result = createCourseSchema.safeParse({
        title: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });

    it('should accept title at boundary (3 chars)', () => {
      const result = createCourseSchema.safeParse({
        title: 'ABC',
      });

      expect(result.success).toBe(true);
    });

    it('should accept title at boundary (200 chars)', () => {
      const result = createCourseSchema.safeParse({
        title: 'a'.repeat(200),
      });

      expect(result.success).toBe(true);
    });

    // NEW: Title with special characters
    it('should accept title with special characters', () => {
      const result = createCourseSchema.safeParse({
        title: 'Learn C++ & JavaScript (2024)',
      });

      expect(result.success).toBe(true);
    });

    // NEW: XSS in title (schema accepts, app should sanitize)
    it('should accept title (XSS prevention is app-layer)', () => {
      const result = createCourseSchema.safeParse({
        title: '<script>alert("xss")</script>',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('price validation', () => {
    it('should default price to 0 when not provided', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(0);
      }
    });

    it('should accept valid positive price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        price: 100000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(100000);
      }
    });

    it('should accept zero price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        price: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        price: -100,
      });

      expect(result.success).toBe(false);
    });

    // NEW: Large price
    it('should accept large price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        price: 999999999,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('discount_price validation', () => {
    it('should accept valid discount price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        price: 100000,
        discount_price: 75000,
      });

      expect(result.success).toBe(true);
    });

    it('should accept null discount_price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        discount_price: null,
      });

      expect(result.success).toBe(true);
    });

    it('should reject negative discount_price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        discount_price: -50,
      });

      expect(result.success).toBe(false);
    });

    // NEW: Zero discount is valid
    it('should accept zero discount_price', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        discount_price: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('thumbnail_url validation', () => {
    it('should accept valid URL', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        thumbnail_url: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
    });

    it('should accept null thumbnail_url', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        thumbnail_url: null,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        thumbnail_url: 'not-a-url',
      });

      expect(result.success).toBe(false);
    });

    // NEW: Different URL schemes
    it('should accept HTTP URL', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        thumbnail_url: 'http://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
    });

    it('should accept URL with query parameters', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        thumbnail_url: 'https://example.com/image.jpg?width=300&height=200',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('category_ids validation', () => {
    it('should accept valid UUID array', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        category_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty array', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        category_ids: [],
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        category_ids: ['not-a-uuid'],
      });

      expect(result.success).toBe(false);
    });

    it('should accept missing category_ids', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('duration_hours validation', () => {
    it('should accept valid duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should reject non-integer duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: 10.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: -5,
      });

      expect(result.success).toBe(false);
    });

    it('should accept zero duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should accept null duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: null,
      });

      expect(result.success).toBe(true);
    });

    // NEW: Large duration
    it('should accept large duration', () => {
      const result = createCourseSchema.safeParse({
        title: 'Course Title',
        duration_hours: 1000,
      });

      expect(result.success).toBe(true);
    });
  });
});