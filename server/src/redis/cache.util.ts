import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';

const defaultLogger = new Logger('CacheUtil');

/**
 * Retrieve and deserialize a JSON-encoded value from Redis.
 * Fails open (returns null) on Redis connection or parsing errors.
 */
export async function getCache<T>(
  redis: Redis,
  key: string,
  logger: Logger = defaultLogger,
): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (err) {
    const error = err as Error;
    logger.warn(`Redis GET failed for key "${key}": ${error.message}`);
    return null;
  }
}

/**
 * Serialize and store a value in Redis with an optional TTL in seconds.
 * Fails open (logs warning without throwing) on Redis connection errors.
 */
export async function setCache<T>(
  redis: Redis,
  key: string,
  value: T,
  ttlSeconds?: number,
  logger: Logger = defaultLogger,
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (err) {
    const error = err as Error;
    logger.warn(`Redis SET failed for key "${key}": ${error.message}`);
    return false;
  }
}

/**
 * Invalidate (delete) one or multiple keys from Redis.
 * Fails open on Redis errors.
 */
export async function invalidateCache(
  redis: Redis,
  keyOrKeys: string | string[],
  logger: Logger = defaultLogger,
): Promise<boolean> {
  try {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (keys.length === 0) {
      return true;
    }
    await redis.del(...keys);
    return true;
  } catch (err) {
    const error = err as Error;
    logger.warn(
      `Redis DEL failed for keys [${Array.isArray(keyOrKeys) ? keyOrKeys.join(', ') : keyOrKeys}]: ${error.message}`,
    );
    return false;
  }
}

/**
 * Cache-Aside orchestrator.
 * 1. Checks Redis for cached value.
 * 2. On cache miss or Redis error, executes fetcher().
 * 3. Asynchronously stores fetcher() result into Redis.
 * 4. Returns the result.
 */
export async function getOrSetCache<T>(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  logger: Logger = defaultLogger,
): Promise<T> {
  const cached = await getCache<T>(redis, key, logger);
  if (cached !== null) {
    return cached;
  }

  const freshData = await fetcher();

  // Populate cache non-blockingly; do not fail request if set fails
  await setCache(redis, key, freshData, ttlSeconds, logger);

  return freshData;
}
