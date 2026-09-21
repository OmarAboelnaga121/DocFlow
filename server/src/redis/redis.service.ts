import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import {
  getCache,
  setCache,
  invalidateCache,
  getOrSetCache,
} from './cache.util';

@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');
    const host = configService.get<string>('REDIS_HOST', 'localhost');
    const port = configService.get<number>('REDIS_PORT', 6379);
    const password = configService.get<string>('REDIS_PASSWORD');

    const options = {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      ...(password ? { password } : {}),
    } satisfies RedisOptions;

    if (redisUrl) {
      super(redisUrl, options);
    } else {
      super({
        host,
        port: Number(port),
        ...options,
      });
    }

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.on('connect', () => {
      this.logger.log('Redis client initiating connection...');
    });

    this.on('ready', () => {
      this.logger.log('Redis client connected and ready.');
    });

    this.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });

    this.on('close', () => {
      this.logger.warn('Redis connection closed.');
    });

    this.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis reconnecting in ${delay}ms...`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to establish initial Redis connection: ${err.message}`,
        err.stack,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.quit();
      this.logger.log('Redis client disconnected gracefully.');
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error during Redis client shutdown: ${err.message}`,
        err.stack,
      );
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    return getCache<T>(this, key, this.logger);
  }

  async setCache<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<boolean> {
    return setCache<T>(this, key, value, ttlSeconds, this.logger);
  }

  async invalidateCache(keyOrKeys: string | string[]): Promise<boolean> {
    return invalidateCache(this, keyOrKeys, this.logger);
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    return getOrSetCache<T>(this, key, ttlSeconds, fetcher, this.logger);
  }
}
