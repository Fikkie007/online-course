import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreate schemas from API routes for testing
const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
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

describe('Register Schema Validation', () => {
  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email tidak valid');
      }
    });

    it('should reject missing email', () => {
      const result = registerSchema.safeParse({
        password: 'password123',
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
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('password validation', () => {
    it('should accept password with 6+ characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 6 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '12345',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password minimal 6 karakter');
      }
    });

    it('should reject empty password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
    });

    it('should accept long passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'a'.repeat(100),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('fullName validation (optional)', () => {
    it('should accept valid fullName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      });

      expect(result.success).toBe(true);
    });

    it('should accept missing fullName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject fullName shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'J',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nama minimal 2 karakter');
      }
    });
  });

  describe('recaptchaToken validation (optional)', () => {
    it('should accept valid recaptchaToken', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        recaptchaToken: 'some-token-string',
      });

      expect(result.success).toBe(true);
    });

    it('should accept missing recaptchaToken', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });
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
  });
});