import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => key === 'CACHE_TTL_SECONDS' ? 60 : fallback),
  } as unknown as ConfigService;

  it('loads directly when Redis is not configured', async () => {
    const cache = new CacheService(config);
    const load = jest.fn().mockResolvedValue({ id: 1 });

    await expect(cache.remember('products:item:1', load)).resolves.toEqual({ id: 1 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('creates stable keys independent of object property order', () => {
    const cache = new CacheService(config);

    expect(cache.key('products:list', { page: 1, category: 'coffee' }))
      .toBe(cache.key('products:list', { category: 'coffee', page: 1 }));
  });
});
