import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  welcomeEmailTemplate,
  enrollmentSuccessEmailTemplate,
  courseCompletionEmailTemplate,
  paymentFailedEmailTemplate,
  passwordResetEmailTemplate,
} from '@/lib/resend/templates';

// Mock environment variable
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');

describe('Email Templates', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('welcomeEmailTemplate', () => {
    it('should generate HTML with user name', () => {
      const html = welcomeEmailTemplate({ name: 'John Doe' });

      expect(html).toContain('John Doe');
      expect(html).toContain('Selamat Datang');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include course exploration link', () => {
      const html = welcomeEmailTemplate({ name: 'Test User' });

      expect(html).toContain('http://localhost:3000/courses');
      expect(html).toContain('Jelajahi Kursus');
    });

    it('should handle empty name', () => {
      const html = welcomeEmailTemplate({ name: '' });

      expect(html).toBeDefined();
      expect(html).toContain('<strong></strong>');
    });

    it('should escape special characters in name (XSS prevention)', () => {
      const html = welcomeEmailTemplate({ name: 'John & Jane <test>' });

      // SECURITY: HTML should be escaped to prevent XSS
      expect(html).toContain('John &amp; Jane &lt;test&gt;');
      expect(html).not.toContain('John & Jane <test>'); // Raw HTML should NOT be present
    });
  });

  describe('enrollmentSuccessEmailTemplate', () => {
    it('should generate HTML with enrollment details', () => {
      const html = enrollmentSuccessEmailTemplate({
        name: 'Student Name',
        courseName: 'Introduction to Programming',
        price: 150000,
        enrolledAt: '2024-01-15T10:30:00Z',
      });

      expect(html).toContain('Student Name');
      expect(html).toContain('Introduction to Programming');
      expect(html).toContain('Rp 150.000');
      expect(html).toContain('Pendaftaran Berhasil');
    });

    it('should handle free course (price = 0)', () => {
      const html = enrollmentSuccessEmailTemplate({
        name: 'Student',
        courseName: 'Free Course',
        price: 0,
        enrolledAt: '2024-01-15T10:30:00Z',
      });

      expect(html).toContain('Gratis');
    });

    it('should format date correctly', () => {
      const html = enrollmentSuccessEmailTemplate({
        name: 'Student',
        courseName: 'Course',
        price: 100000,
        enrolledAt: '2024-01-15T10:30:00Z',
      });

      // Date should be formatted in Indonesian locale
      expect(html).toMatch(/\d{4}/); // Contains year
    });

    it('should include start learning link', () => {
      const html = enrollmentSuccessEmailTemplate({
        name: 'Student',
        courseName: 'Course',
        price: 50000,
        enrolledAt: '2024-01-15',
      });

      expect(html).toContain('http://localhost:3000/student/courses');
      expect(html).toContain('Mulai Belajar');
    });

    it('should handle large prices', () => {
      const html = enrollmentSuccessEmailTemplate({
        name: 'Student',
        courseName: 'Premium Course',
        price: 10000000, // 10 million
        enrolledAt: '2024-01-15',
      });

      expect(html).toContain('Rp');
      expect(html).toBeDefined();
    });
  });

  describe('courseCompletionEmailTemplate', () => {
    it('should generate HTML with completion details', () => {
      const html = courseCompletionEmailTemplate({
        name: 'Graduate',
        courseName: 'Advanced JavaScript',
        certificateUrl: 'http://localhost:3000/certificate/CERT-123',
      });

      expect(html).toContain('Graduate');
      expect(html).toContain('Advanced JavaScript');
      expect(html).toContain('Selamat');
      expect(html).toContain('Sertifikat');
    });

    it('should include certificate link', () => {
      const html = courseCompletionEmailTemplate({
        name: 'Student',
        courseName: 'Course',
        certificateUrl: 'https://example.com/cert/CERT-ABC-123',
      });

      expect(html).toContain('https://example.com/cert/CERT-ABC-123');
      expect(html).toContain('Lihat Sertifikat');
    });

    it('should handle long course names', () => {
      const longName = 'Very Long Course Name That Should Still Work Properly';
      const html = courseCompletionEmailTemplate({
        name: 'Student',
        courseName: longName,
        certificateUrl: 'http://example.com/cert',
      });

      expect(html).toContain(longName);
    });
  });

  describe('paymentFailedEmailTemplate', () => {
    it('should generate HTML with failure details', () => {
      const html = paymentFailedEmailTemplate({
        name: 'Customer',
        courseName: 'Course Name',
        amount: 250000,
      });

      expect(html).toContain('Customer');
      expect(html).toContain('Course Name');
      expect(html).toContain('Rp 250.000');
      expect(html).toContain('Pembayaran Gagal');
    });

    it('should include retry link', () => {
      const html = paymentFailedEmailTemplate({
        name: 'Customer',
        courseName: 'Course',
        amount: 100000,
      });

      expect(html).toContain('http://localhost:3000/courses');
      expect(html).toContain('Coba Lagi');
    });

    it('should format amount in Indonesian locale', () => {
      const html = paymentFailedEmailTemplate({
        name: 'Customer',
        courseName: 'Course',
        amount: 1500, // Should be formatted as 1.500
      });

      expect(html).toContain('Rp');
    });
  });

  describe('passwordResetEmailTemplate', () => {
    it('should generate HTML with reset details', () => {
      const html = passwordResetEmailTemplate({
        name: 'User Name',
        resetUrl: 'http://localhost:3000/reset-password?token=abc123',
        expiresInMinutes: 60,
      });

      expect(html).toContain('User Name');
      expect(html).toContain('http://localhost:3000/reset-password?token=abc123');
      expect(html).toContain('60 menit');
      expect(html).toContain('Reset Password');
    });

    it('should include expiry notice', () => {
      const html = passwordResetEmailTemplate({
        name: 'User',
        resetUrl: 'http://example.com/reset',
        expiresInMinutes: 30,
      });

      expect(html).toContain('kadaluarsa');
      expect(html).toContain('30 menit');
    });

    it('should handle empty name (fallback)', () => {
      const html = passwordResetEmailTemplate({
        name: '',
        resetUrl: 'http://example.com/reset',
        expiresInMinutes: 15,
      });

      expect(html).toContain('Pengguna'); // Fallback text
    });

    it('should include plain text link backup', () => {
      const html = passwordResetEmailTemplate({
        name: 'User',
        resetUrl: 'http://example.com/reset-token-xyz',
        expiresInMinutes: 60,
      });

      expect(html).toContain('salin dan tempel');
      expect(html).toContain('http://example.com/reset-token-xyz');
    });

    it('should handle different expiry times', () => {
      const html15 = passwordResetEmailTemplate({
        name: 'User',
        resetUrl: 'http://example.com/reset',
        expiresInMinutes: 15,
      });

      const html120 = passwordResetEmailTemplate({
        name: 'User',
        resetUrl: 'http://example.com/reset',
        expiresInMinutes: 120,
      });

      expect(html15).toContain('15 menit');
      expect(html120).toContain('120 menit');
    });
  });
});