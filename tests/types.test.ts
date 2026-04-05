import { describe, it, expect } from 'vitest';
import {
  UserRole,
  CourseStatus,
  ContentType,
  EnrollmentStatus,
  PaymentStatus,
  NotificationChannel,
  NotificationStatus,
} from '@/types';

describe('Types and Enums', () => {
  describe('UserRole enum', () => {
    it('should have ADMIN value', () => {
      expect(UserRole.ADMIN).toBe('admin');
    });

    it('should have MENTOR value', () => {
      expect(UserRole.MENTOR).toBe('mentor');
    });

    it('should have STUDENT value', () => {
      expect(UserRole.STUDENT).toBe('student');
    });

    it('should have exactly 3 roles', () => {
      expect(Object.keys(UserRole).length).toBe(3);
    });
  });

  describe('CourseStatus enum', () => {
    it('should have DRAFT value', () => {
      expect(CourseStatus.DRAFT).toBe('draft');
    });

    it('should have PUBLISHED value', () => {
      expect(CourseStatus.PUBLISHED).toBe('published');
    });

    it('should have ARCHIVED value', () => {
      expect(CourseStatus.ARCHIVED).toBe('archived');
    });

    it('should have exactly 3 statuses', () => {
      expect(Object.keys(CourseStatus).length).toBe(3);
    });
  });

  describe('ContentType enum', () => {
    it('should have VIDEO value', () => {
      expect(ContentType.VIDEO).toBe('video');
    });

    it('should have DOCUMENT value', () => {
      expect(ContentType.DOCUMENT).toBe('document');
    });

    it('should have QUIZ value', () => {
      expect(ContentType.QUIZ).toBe('quiz');
    });

    it('should have exactly 3 types', () => {
      expect(Object.keys(ContentType).length).toBe(3);
    });
  });

  describe('EnrollmentStatus enum', () => {
    it('should have PENDING value', () => {
      expect(EnrollmentStatus.PENDING).toBe('pending');
    });

    it('should have ACTIVE value', () => {
      expect(EnrollmentStatus.ACTIVE).toBe('active');
    });

    it('should have COMPLETED value', () => {
      expect(EnrollmentStatus.COMPLETED).toBe('completed');
    });

    it('should have EXPIRED value', () => {
      expect(EnrollmentStatus.EXPIRED).toBe('expired');
    });

    it('should have exactly 4 statuses', () => {
      expect(Object.keys(EnrollmentStatus).length).toBe(4);
    });
  });

  describe('PaymentStatus enum', () => {
    it('should have PENDING value', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
    });

    it('should have SUCCESS value', () => {
      expect(PaymentStatus.SUCCESS).toBe('success');
    });

    it('should have FAILED value', () => {
      expect(PaymentStatus.FAILED).toBe('failed');
    });

    it('should have EXPIRED value', () => {
      expect(PaymentStatus.EXPIRED).toBe('expired');
    });

    it('should have REFUNDED value', () => {
      expect(PaymentStatus.REFUNDED).toBe('refunded');
    });

    it('should have exactly 5 statuses', () => {
      expect(Object.keys(PaymentStatus).length).toBe(5);
    });
  });

  describe('NotificationChannel enum', () => {
    it('should have EMAIL value', () => {
      expect(NotificationChannel.EMAIL).toBe('email');
    });

    it('should have WHATSAPP value', () => {
      expect(NotificationChannel.WHATSAPP).toBe('whatsapp');
    });

    it('should have BOTH value', () => {
      expect(NotificationChannel.BOTH).toBe('both');
    });

    it('should have exactly 3 channels', () => {
      expect(Object.keys(NotificationChannel).length).toBe(3);
    });
  });

  describe('NotificationStatus enum', () => {
    it('should have PENDING value', () => {
      expect(NotificationStatus.PENDING).toBe('pending');
    });

    it('should have SENT value', () => {
      expect(NotificationStatus.SENT).toBe('sent');
    });

    it('should have FAILED value', () => {
      expect(NotificationStatus.FAILED).toBe('failed');
    });

    it('should have exactly 3 statuses', () => {
      expect(Object.keys(NotificationStatus).length).toBe(3);
    });
  });

  describe('Enum value validation', () => {
    it('should allow string comparison for UserRole', () => {
      const role: UserRole = UserRole.ADMIN;
      expect(role === 'admin').toBe(true);
    });

    it('should allow string comparison for CourseStatus', () => {
      const status: CourseStatus = CourseStatus.PUBLISHED;
      expect(status === 'published').toBe(true);
    });

    it('should validate enum membership', () => {
      const validRoles = Object.values(UserRole);
      expect(validRoles.includes('admin')).toBe(true);
      expect(validRoles.includes('invalid')).toBe(false);
    });
  });
});