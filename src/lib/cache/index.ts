/**
 * Redis Caching Utility
 * Provides a simple interface for caching API responses
 */

import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[Redis] Max retries reached, giving up');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        redisClient = null;
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });
    } catch (error) {
      console.warn('[Redis] Failed to initialize:', error);
      redisClient = null;
    }
  }
  return redisClient;
}

/**
 * Cache configuration options
 */
interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Skip cache and force fresh fetch */
  bypass?: boolean;
}

/**
 * Default TTL values for different data types (in seconds)
 */
export const CACHE_TTL = {
  CATEGORIES: 300,      // 5 minutes - rarely changes
  COURSE_LIST: 60,      // 1 minute - changes with enrollments
  COURSE_DETAIL: 300,   // 5 minutes - semi-static
  USER_PROFILE: 300,    // 5 minutes
  STATIC_DATA: 3600,    // 1 hour - very static data
} as const;

/**
 * Fetch data with caching
 * If Redis is unavailable, falls back to direct fetch without caching
 *
 * @param key - Unique cache key
 * @param fetcher - Function to fetch fresh data
 * @param options - Cache options including TTL
 * @returns Cached or fresh data
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 60, bypass = false } = options;
  const redis = getRedisClient();

  // Skip cache if bypass requested or Redis unavailable
  if (bypass || !redis) {
    return fetcher();
  }

  try {
    // Try to get from cache
    const cachedData = await redis.get(key);

    if (cachedData !== null) {
      try {
        return JSON.parse(cachedData) as T;
      } catch {
        // Invalid JSON, fetch fresh
        console.warn(`[Cache] Invalid JSON for key: ${key}`);
      }
    }

    // Fetch fresh data
    const freshData = await fetcher();

    // Store in cache (fire and forget)
    redis.set(key, JSON.stringify(freshData), 'EX', ttl).catch((err) => {
      console.error(`[Cache] Failed to set key ${key}:`, err.message);
    });

    return freshData;
  } catch (error) {
    console.error(`[Cache] Error for key ${key}:`, error);
    // Fallback to direct fetch on any cache error
    return fetcher();
  }
}

/**
 * Invalidate cache by key
 * Can accept patterns with wildcards for batch invalidation
 *
 * @param key - Cache key or pattern (e.g., "courses:*")
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    if (key.includes('*')) {
      // Handle pattern deletion
      const keys = await redis.keys(key);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} keys matching: ${key}`);
      }
    } else {
      await redis.del(key);
      console.log(`[Cache] Invalidated key: ${key}`);
    }
  } catch (error) {
    console.error(`[Cache] Failed to invalidate ${key}:`, error);
  }
}

/**
 * Invalidate multiple cache keys
 *
 * @param keys - Array of cache keys to invalidate
 */
export async function invalidateMultiple(keys: string[]): Promise<void> {
  const redis = getRedisClient();

  if (!redis || keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
    console.log(`[Cache] Invalidated ${keys.length} keys`);
  } catch (error) {
    console.error('[Cache] Failed to invalidate keys:', error);
  }
}

/**
 * Check if Redis is available and healthy
 */
export async function isRedisHealthy(): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    return false;
  }

  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keys: number;
  memory: string | null;
}> {
  const redis = getRedisClient();

  if (!redis) {
    return { connected: false, keys: 0, memory: null };
  }

  try {
    const [dbsize, info] = await Promise.all([
      redis.dbsize(),
      redis.info('memory'),
    ]);

    // Parse used_memory_human from info
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memory = memoryMatch ? memoryMatch[1] : null;

    return {
      connected: true,
      keys: dbsize,
      memory,
    };
  } catch (error) {
    console.error('[Cache] Failed to get stats:', error);
    return { connected: false, keys: 0, memory: null };
  }
}