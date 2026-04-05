import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// HELPER: Create chainable mock for Supabase
// =============================================================================

function createChainableMock() {
  const chain: Record<string, any> = {};

  // Build chain methods
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'single', 'maybeSingle', 'order', 'limit', 'range', 'mockResolvedValueOnce', 'mockReturnValue'];

  methods.forEach(method => {
    chain[method] = vi.fn(() => chain);
  });

  // Terminal methods
  chain.then = vi.fn((resolve) => {
    resolve(chain._data);
    return Promise.resolve(chain._data);
  });

  chain._data = { data: null, error: null };

  return chain;
}

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)),
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  requireRole: vi.fn(),
  isAdmin: vi.fn(),
  isMentor: vi.fn(),
  isStudent: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/utils/recaptcha', () => ({
  verifyRecaptcha: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/midtrans', () => ({
  createSnapToken: vi.fn(() => Promise.resolve({ token: 'snap-token-123' })),
  checkTransactionStatus: vi.fn(() => Promise.resolve({
    order_id: 'PAY-test',
    transaction_status: 'settlement',
    payment_type: 'credit_card',
    gross_amount: '100000.00',
  })),
  verifySignature: vi.fn(() => true),
}));

vi.mock('@/lib/queue', () => ({
  sendEnrollmentNotification: vi.fn(() => Promise.resolve()),
}));

// Helper to create NextRequest
function createRequest(body: unknown, method: string = 'POST'): NextRequest {
  const url = 'http://localhost:3000/api/test';
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createGetRequest(path: string = '/api/test'): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method: 'GET' });
}

// =============================================================================
// TESTS
// =============================================================================

describe('API Integration Tests', () => {
  let mockSupabaseClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset auth mocks
    const auth = await import('@/lib/auth');
    vi.mocked(auth.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
    });
    vi.mocked(auth.isAdmin).mockResolvedValue(false);
    vi.mocked(auth.isMentor).mockResolvedValue(false);

    // Create fresh supabase mock for each test
    mockSupabaseClient = {
      from: vi.fn(() => mockSupabaseClient),
      select: vi.fn(() => mockSupabaseClient),
      insert: vi.fn(() => mockSupabaseClient),
      update: vi.fn(() => mockSupabaseClient),
      delete: vi.fn(() => mockSupabaseClient),
      eq: vi.fn(() => mockSupabaseClient),
      neq: vi.fn(() => mockSupabaseClient),
      in: vi.fn(() => mockSupabaseClient),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      order: vi.fn(() => mockSupabaseClient),
      limit: vi.fn(() => mockSupabaseClient),
      range: vi.fn(() => mockSupabaseClient),
      rpc: vi.fn(),
    };

    const supabase = await import('@/lib/supabase/admin');
    vi.mocked(supabase.createAdminClient).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // AUTH: Register Endpoint
  // ===========================================================================
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      // Mock: email not exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: insert success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'cred_123', email: 'new@example.com' },
        error: null,
      });

      const request = createRequest({
        email: 'new@example.com',
        password: 'SecurePass123',
        fullName: 'New User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Akun berhasil dibuat');
    });

    it('should reject duplicate email', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      // Mock: email already exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'existing-user', email: 'existing@example.com' },
        error: null,
      });

      const request = createRequest({
        email: 'existing@example.com',
        password: 'SecurePass123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email sudah terdaftar');
    });

    it('should reject weak password (too short)', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = createRequest({
        email: 'test@example.com',
        password: 'weak',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Password minimal 8 karakter');
    });

    it('should reject password without uppercase', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject password without number', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = createRequest({
        email: 'test@example.com',
        password: 'PasswordOnly',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = createRequest({
        email: 'invalid-email',
        password: 'SecurePass123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email tidak valid');
    });

    it('should reject missing email', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = createRequest({
        password: 'SecurePass123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ===========================================================================
  // AUTH: Check Email Endpoint
  // ===========================================================================
  describe('POST /api/auth/check-email', () => {
    it('should return exists=true for registered email with password', async () => {
      const { POST } = await import('@/app/api/auth/check-email/route');

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-123', email: 'existing@example.com', has_password: 'hashed_value' },
        error: null,
      });

      const request = createRequest({ email: 'existing@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.exists).toBe(true);
      expect(data.hasPassword).toBe(true);
    });

    it('should return exists=true hasPassword=false for Google-only user', async () => {
      const { POST } = await import('@/app/api/auth/check-email/route');

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-123', email: 'google@example.com', has_password: null },
        error: null,
      });

      const request = createRequest({ email: 'google@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.exists).toBe(true);
      expect(data.hasPassword).toBe(false);
    });

    it('should return exists=false for unregistered email', async () => {
      const { POST } = await import('@/app/api/auth/check-email/route');

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest({ email: 'nonexistent@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.exists).toBe(false);
      expect(data.hasPassword).toBe(false);
    });

    it('should reject missing email', async () => {
      const { POST } = await import('@/app/api/auth/check-email/route');

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ===========================================================================
  // CATEGORIES: List Endpoint
  // ===========================================================================
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const { GET } = await import('@/app/api/categories/route');

      const mockCategories = [
        { id: 'cat-1', name: 'Programming', slug: 'programming', order_index: 1 },
        { id: 'cat-2', name: 'Design', slug: 'design', order_index: 2 },
      ];

      // Mock the final result
      mockSupabaseClient.single = undefined; // not called
      mockSupabaseClient.order.mockImplementation(() => {
        // Return a promise-like that resolves to categories
        return {
          then: (resolve: any) => resolve({ data: mockCategories, error: null }),
        };
      });

      const request = createGetRequest('/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });
  });

  // ===========================================================================
  // CATEGORIES: Create Endpoint (Admin)
  // ===========================================================================
  describe('POST /api/categories', () => {
    it('should reject non-admin user', async () => {
      const { POST } = await import('@/app/api/categories/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.isAdmin).mockResolvedValueOnce(false);

      const request = createRequest({
        name: 'New Category',
        slug: 'new-category',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should reject unauthenticated user', async () => {
      const { POST } = await import('@/app/api/categories/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.getCurrentUser).mockResolvedValueOnce(null);

      const request = createRequest({
        name: 'New Category',
        slug: 'new-category',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject missing required fields', async () => {
      const { POST } = await import('@/app/api/categories/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.isAdmin).mockResolvedValueOnce(true);

      const request = createRequest({ name: 'Only Name' }); // Missing slug

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  // ===========================================================================
  // PAYMENTS: Create Endpoint
  // ===========================================================================
  describe('POST /api/payments/create', () => {
    it('should reject unauthenticated user', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.getCurrentUser).mockResolvedValueOnce(null);

      const request = createRequest({ course_id: 'course-1' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject missing course_id', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  // ===========================================================================
  // PAYMENTS: Status Endpoint (IDOR Protection Test)
  // ===========================================================================
  describe('GET /api/payments/status', () => {
    it('should reject unauthenticated user', async () => {
      const { GET } = await import('@/app/api/payments/status/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.getCurrentUser).mockResolvedValueOnce(null);

      const request = createGetRequest('/api/payments/status?order_id=PAY-test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject missing order_id', async () => {
      const { GET } = await import('@/app/api/payments/status/route');

      const request = createGetRequest('/api/payments/status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('order_id is required');
    });
  });

  // ===========================================================================
  // NOTIFICATIONS: Mark as Read
  // ===========================================================================
  describe('PATCH /api/notifications/[notificationId]/read', () => {
    it('should reject unauthenticated user', async () => {
      const { PATCH } = await import('@/app/api/notifications/[notificationId]/read/route');

      const auth = await import('@/lib/auth');
      vi.mocked(auth.getCurrentUser).mockResolvedValueOnce(null);

      const request = createRequest({});
      const params = Promise.resolve({ notificationId: 'notif-1' });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  // ===========================================================================
  // AUTH: Forgot Password
  // ===========================================================================
  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email (security)', async () => {
      const { POST } = await import('@/app/api/auth/forgot-password/route');

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest({ email: 'nonexistent@example.com' });
      const response = await POST(request);
      const data = await response.json();

      // SECURITY: Should not reveal if email exists or not
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Jika email terdaftar');
    });

    it('should reject invalid email format', async () => {
      const { POST } = await import('@/app/api/auth/forgot-password/route');

      const request = createRequest({ email: 'invalid-email' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ===========================================================================
  // WEBHOOKS: Midtrans
  // ===========================================================================
  describe('POST /api/webhooks/midtrans', () => {
    it('should reject invalid signature', async () => {
      const { POST } = await import('@/app/api/webhooks/midtrans/route');

      const midtrans = await import('@/lib/midtrans');
      vi.mocked(midtrans.verifySignature).mockReturnValueOnce(false);

      const request = createRequest({
        order_id: 'PAY-test',
        status_code: '200',
        gross_amount: '100000.00',
        signature_key: 'invalid-signature',
        transaction_status: 'settlement',
        payment_type: 'credit_card',
        transaction_id: 'txn-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
    });
  });
});