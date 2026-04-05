import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  enrollmentSuccessWA,
  paymentReminderWA,
  courseCompletionWA,
  newCourseAvailableWA,
} from '@/lib/fonnte/templates';

// Mock environment variable
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');

describe('WhatsApp Templates', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('enrollmentSuccessWA', () => {
    it('should generate WhatsApp message with enrollment details', () => {
      const message = enrollmentSuccessWA('John Doe', 'Introduction to React');

      expect(message).toContain('John Doe');
      expect(message).toContain('Introduction to React');
      expect(message).toContain('Pendaftaran Berhasil');
      expect(message).toContain('🎓');
    });

    it('should include course link', () => {
      const message = enrollmentSuccessWA('Student', 'Course Name');

      expect(message).toContain('http://localhost:3000/student/courses');
    });

    it('should handle special characters in names', () => {
      const message = enrollmentSuccessWA('John & Jane', 'Course "Special"');

      expect(message).toContain('John & Jane');
      expect(message).toContain('Course "Special"');
    });

    it('should format message with proper WhatsApp markdown', () => {
      const message = enrollmentSuccessWA('Student', 'Test Course');

      // WhatsApp uses asterisks for bold
      expect(message).toContain('*Pendaftaran Berhasil!*');
      expect(message).toContain('📚');
    });

    it('should handle long course names', () => {
      const longName = 'A Very Comprehensive Course About Everything You Need to Know';
      const message = enrollmentSuccessWA('Student', longName);

      expect(message).toContain(longName);
    });
  });

  describe('paymentReminderWA', () => {
    it('should generate payment reminder message', () => {
      const message = paymentReminderWA('Customer', 'Premium Course', 500000);

      expect(message).toContain('Customer');
      expect(message).toContain('Premium Course');
      expect(message).toContain('Rp 500.000');
      expect(message).toContain('Reminder Pembayaran');
      expect(message).toContain('⏰');
    });

    it('should format amount in Indonesian locale', () => {
      const message = paymentReminderWA('User', 'Course', 1500);

      expect(message).toContain('Rp');
      expect(message).toContain('1.500');
    });

    it('should handle large amounts', () => {
      const message = paymentReminderWA('User', 'Course', 10000000);

      expect(message).toContain('Rp');
      expect(message).toBeDefined();
    });

    it('should include ignore message notice', () => {
      const message = paymentReminderWA('User', 'Course', 100000);

      expect(message).toContain('abaikan');
    });
  });

  describe('courseCompletionWA', () => {
    it('should generate completion message with certificate', () => {
      const message = courseCompletionWA(
        'Graduate',
        'Advanced TypeScript',
        'http://localhost:3000/certificate/CERT-123'
      );

      expect(message).toContain('Graduate');
      expect(message).toContain('Advanced TypeScript');
      expect(message).toContain('http://localhost:3000/certificate/CERT-123');
      expect(message).toContain('Selamat');
      expect(message).toContain('🏆');
    });

    it('should include certificate link', () => {
      const message = courseCompletionWA(
        'Student',
        'Course',
        'https://certificates.example.com/CERT-ABC'
      );

      expect(message).toContain('https://certificates.example.com/CERT-ABC');
    });

    it('should have motivational message', () => {
      const message = courseCompletionWA('Student', 'Course', 'http://cert-url');

      expect(message).toContain('Terus belajar');
      expect(message).toContain('🚀');
    });
  });

  describe('newCourseAvailableWA', () => {
    it('should generate new course announcement', () => {
      const message = newCourseAvailableWA(
        'Machine Learning Fundamentals',
        'Dr. Smith',
        'http://localhost:3000/course/ml-fundamentals'
      );

      expect(message).toContain('Machine Learning Fundamentals');
      expect(message).toContain('Dr. Smith');
      expect(message).toContain('http://localhost:3000/course/ml-fundamentals');
      expect(message).toContain('Kursus Baru');
      expect(message).toContain('🆕');
    });

    it('should include mentor name', () => {
      const message = newCourseAvailableWA('Course', 'John Doe', 'http://url');

      expect(message).toContain('👨‍🏫');
      expect(message).toContain('John Doe');
    });

    it('should have encouraging message', () => {
      const message = newCourseAvailableWA('Course', 'Mentor', 'http://url');

      expect(message).toContain('Jangan lewatkan');
      expect(message).toContain('🎯');
    });
  });
});