import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_STORE } from './cache-store';

@Global()
@Module({
  providers: [
    CacheService,
    { provide: CACHE_STORE, useExisting: CacheService },
  ],
  exports: [CACHE_STORE],
})
export class CacheModule {}
