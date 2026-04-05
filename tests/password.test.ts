import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // bcrypt generates unique salts, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against non-empty hash', async () => {
      const password = 'somePassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('should return false for password against empty hash', async () => {
      const result = await verifyPassword('somePassword', '');
      expect(result).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const result = await verifyPassword('password', 'invalid-hash');
      expect(result).toBe(false);
    });

    it('should verify across different hash instances', async () => {
      const password = 'testPassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Both hashes should verify the same password
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });
});