import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isRedisHealthy, getCacheStats } from '@/lib/cache';

/**
 * Health Check API Endpoint
 * GET /api/health
 *
 * Returns the health status of critical services:
 * - Database (Supabase)
 * - Cache (Redis)
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; message?: string }> = {};

  // Check Database
  try {
    const dbStart = Date.now();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    const dbLatency = Date.now() - dbStart;

    if (error) {
      checks.database = {
        status: 'error',
        latency: dbLatency,
        message: error.message,
      };
    } else {
      checks.database = {
        status: 'ok',
        latency: dbLatency,
      };
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    const isHealthy = await isRedisHealthy();
    const redisLatency = Date.now() - redisStart;

    if (isHealthy) {
      const stats = await getCacheStats();
      checks.redis = {
        status: 'ok',
        latency: redisLatency,
        message: stats.keys !== undefined ? `${stats.keys} keys, ${stats.memory || 'unknown memory'}` : undefined,
      };
    } else {
      checks.redis = {
        status: 'ok', // Redis is optional, not critical
        latency: redisLatency,
        message: 'Not configured (using fallback)',
      };
    }
  } catch (error) {
    checks.redis = {
      status: 'ok',
      message: 'Not configured',
    };
  }

  // Determine overall status
  const allOk = Object.values(checks).every((check) => check.status === 'ok');
  const overallStatus = allOk ? 'ok' : 'degraded';

  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latency: totalLatency,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks,
    },
    {
      status: overallStatus === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}