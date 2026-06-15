import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { CacheStore } from './cache-store';

@Injectable()
export class CacheService implements CacheStore, OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: ReturnType<typeof createClient>;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    this.enabled = Boolean(url);
    this.defaultTtl = Number(this.config.get('CACHE_TTL_SECONDS', 60));
    this.client = createClient({
      url,
      socket: {
        connectTimeout: 2_000,
        reconnectStrategy: (retries) => retries >= 3 ? new Error('Redis reconnect limit reached') : retries * 250,
      },
    });
    this.client.on('error', (error) => this.logger.warn(`Redis unavailable: ${error.message}`));
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Redis cache disabled because REDIS_URL is not configured');
      return;
    }

    try {
      await this.client.connect();
      this.logger.log('Redis cache connected');
    } catch (error) {
      this.logger.warn(`Redis connection failed; continuing without cache: ${(error as Error).message}`);
    }
  }

  async onApplicationShutdown() {
    if (this.client.isOpen) await this.client.quit();
  }

  async remember<T>(key: string, load: () => Promise<T>, ttlSeconds = this.defaultTtl): Promise<T> {
    if (!this.client.isReady) return load();

    try {
      const cached = await this.client.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.warn(`Redis read failed for ${key}: ${(error as Error).message}`);
      return load();
    }

    const value = await load();
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      this.logger.warn(`Redis write failed for ${key}: ${(error as Error).message}`);
    }
    return value;
  }

  async invalidate(...prefixes: string[]) {
    if (!this.client.isReady) return;

    try {
      for (const prefix of prefixes) {
        for await (const keys of this.client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
          if (keys.length) await this.client.del(keys);
        }
      }
    } catch (error) {
      this.logger.warn(`Redis invalidation failed: ${(error as Error).message}`);
    }
  }

  key(scope: string, value?: object | number | string) {
    if (value === undefined) return scope;
    if (typeof value !== 'object') return `${scope}:${value}`;
    const normalized = Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== '')
        .sort(([left], [right]) => left.localeCompare(right)),
    );
    return `${scope}:${JSON.stringify(normalized)}`;
  }
}
