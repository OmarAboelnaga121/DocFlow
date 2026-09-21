/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import {
  getCache,
  setCache,
  invalidateCache,
  getOrSetCache,
} from './cache.util';
import type Redis from 'ioredis';

describe('cache.util', () => {
  let mockRedis: Partial<Redis>;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  describe('getCache()', () => {
    it('should return deserialized object on cache hit', async () => {
      const payload = { id: '123', name: 'DocFlow' };
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(payload));

      const result = await getCache(mockRedis as Redis, 'key:1', mockLogger);

      expect(mockRedis.get).toHaveBeenCalledWith('key:1');
      expect(result).toEqual(payload);
    });

    it('should return null on cache miss', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const result = await getCache(mockRedis as Redis, 'key:1', mockLogger);

      expect(result).toBeNull();
    });

    it('should return null and log warning when Redis throws (fail-open)', async () => {
      (mockRedis.get as jest.Mock).mockRejectedValue(
        new Error('Connection lost'),
      );

      const result = await getCache(mockRedis as Redis, 'key:1', mockLogger);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis GET failed for key "key:1"'),
      );
    });
  });

  describe('setCache()', () => {
    it('should serialize and set with TTL in seconds', async () => {
      const payload = { id: '123' };
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      const success = await setCache(
        mockRedis as Redis,
        'key:1',
        payload,
        3600,
        mockLogger,
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key:1',
        JSON.stringify(payload),
        'EX',
        3600,
      );
      expect(success).toBe(true);
    });

    it('should serialize and set without TTL when ttlSeconds is omitted', async () => {
      const payload = { id: '123' };
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      const success = await setCache(
        mockRedis as Redis,
        'key:1',
        payload,
        undefined,
        mockLogger,
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key:1',
        JSON.stringify(payload),
      );
      expect(success).toBe(true);
    });

    it('should return false and log warning when Redis set throws (fail-open)', async () => {
      (mockRedis.set as jest.Mock).mockRejectedValue(
        new Error('OOM command not allowed'),
      );

      const success = await setCache(
        mockRedis as Redis,
        'key:1',
        { a: 1 },
        3600,
        mockLogger,
      );

      expect(success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis SET failed for key "key:1"'),
      );
    });
  });

  describe('invalidateCache()', () => {
    it('should delete a single key', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      const success = await invalidateCache(
        mockRedis as Redis,
        'key:1',
        mockLogger,
      );

      expect(mockRedis.del).toHaveBeenCalledWith('key:1');
      expect(success).toBe(true);
    });

    it('should delete multiple keys when array provided', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(2);

      const success = await invalidateCache(
        mockRedis as Redis,
        ['key:1', 'key:2'],
        mockLogger,
      );

      expect(mockRedis.del).toHaveBeenCalledWith('key:1', 'key:2');
      expect(success).toBe(true);
    });

    it('should return false and log warning when Redis del throws (fail-open)', async () => {
      (mockRedis.del as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const success = await invalidateCache(
        mockRedis as Redis,
        'key:1',
        mockLogger,
      );

      expect(success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis DEL failed for keys [key:1]'),
      );
    });
  });

  describe('getOrSetCache()', () => {
    it('should return cached data on hit without executing fetcher', async () => {
      const cached = { foo: 'bar' };
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));
      const fetcher = jest.fn();

      const result = await getOrSetCache(
        mockRedis as Redis,
        'key:1',
        3600,
        fetcher,
        mockLogger,
      );

      expect(result).toEqual(cached);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should invoke fetcher and cache result on cache miss', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      const fetcher = jest.fn().mockResolvedValue({ db: 'data' });

      const result = await getOrSetCache(
        mockRedis as Redis,
        'key:1',
        3600,
        fetcher,
        mockLogger,
      );

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ db: 'data' });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'key:1',
        JSON.stringify({ db: 'data' }),
        'EX',
        3600,
      );
    });
  });
});
