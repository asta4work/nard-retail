export const CACHE_STORE = Symbol('CACHE_STORE');

export interface CacheStore {
  remember<T>(key: string, load: () => Promise<T>, ttlSeconds?: number): Promise<T>;
  invalidate(...prefixes: string[]): Promise<void>;
  key(scope: string, value?: object | number | string): string;
}
