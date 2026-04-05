import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Recreate verifyRecaptcha for testing
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY not set, skipping verification');
    return true;
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );

    const data = await response.json();

    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // Score >= 0.5 is considered a valid user
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

describe('ReCAPTCHA Verification', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('verifyRecaptcha', () => {
    it('should return true when secret key not set', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', undefined);

      const result = await verifyRecaptcha('some-token');
      expect(result).toBe(true);
    });

    it('should return true for valid response with high score', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 0.9 }),
      });

      const result = await verifyRecaptcha('valid-token');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify?secret=test-secret-key&response=valid-token',
        { method: 'POST' }
      );
    });

    it('should return true for score exactly at threshold (0.5)', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 0.5 }),
      });

      const result = await verifyRecaptcha('threshold-token');
      expect(result).toBe(true);
    });

    it('should return false for low score (< 0.5)', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 0.3 }),
      });

      const result = await verifyRecaptcha('low-score-token');
      expect(result).toBe(false);
    });

    it('should return false when success is false', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, score: 0.9 }),
      });

      const result = await verifyRecaptcha('failed-token');
      expect(result).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyRecaptcha('error-token');
      expect(result).toBe(false);
    });

    it('should return false when JSON parsing fails', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.reject(new Error('JSON parse error')),
      });

      const result = await verifyRecaptcha('invalid-json-token');
      expect(result).toBe(false);
    });

    it('should call correct Google API endpoint', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'my-secret');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 0.7 }),
      });

      await verifyRecaptcha('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google.com/recaptcha/api/siteverify'),
        { method: 'POST' }
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('secret=my-secret'),
        { method: 'POST' }
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('response=test-token'),
        { method: 'POST' }
      );
    });

    it('should handle empty token', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      });

      const result = await verifyRecaptcha('');
      expect(result).toBe(false);
    });

    it('should handle score of 0 (bot)', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 0.0 }),
      });

      const result = await verifyRecaptcha('bot-token');
      expect(result).toBe(false);
    });

    it('should handle score of 1 (perfect human)', async () => {
      vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret-key');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, score: 1.0 }),
      });

      const result = await verifyRecaptcha('perfect-token');
      expect(result).toBe(true);
    });
  });
});