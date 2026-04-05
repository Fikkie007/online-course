import { Redis } from 'ioredis';

let redisConnection: Redis | null = null;

export function getRedisConnection() {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('REDIS_URL not set, queue will not work');
      return null;
    }

    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  return redisConnection;
}