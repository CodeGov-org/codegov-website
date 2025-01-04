import { isNotNil } from './nil';

type CachableFunction<A extends never[], R> = (...args: A) => Promise<R>;

export interface CachableOptions {
  ttl?: number;
}

export interface CacheEntry<T> {
  lastUpdated: number;
  value: T;
}

export function Cachable<
  A extends never[],
  R,
  T extends CachableFunction<A, R>,
>(options: CachableOptions) {
  const ttl = options.ttl ?? Infinity;
  const cache = InMemoryCache.getInstance();

  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: T, ...args: A): Promise<R> {
      const cacheKey = `cache_${propertyKey.toString()}_${toJSON(args)}`;
      const cacheEntry = cache.get(cacheKey);
      const currentTime = Date.now();

      if (isNotNil(cacheEntry)) {
        const parsedCacheEntry = fromJSON<CacheEntry<R>>(cacheEntry);
        const cacheExpiryTime = parsedCacheEntry.lastUpdated + ttl;

        if (currentTime < cacheExpiryTime) {
          return parsedCacheEntry.value;
        }
      }

      const result = await originalMethod.apply(this, args);
      cache.set(
        cacheKey,
        toJSON({
          lastUpdated: currentTime,
          value: result,
        }),
      );

      return result;
    } as T;

    return descriptor;
  };
}

export class InMemoryCache {
  private static instance: InMemoryCache;

  public static getInstance(): InMemoryCache {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache();
    }

    return InMemoryCache.instance;
  }

  private readonly cache: Map<string, string> = new Map();

  private constructor() {}

  public get(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  public set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

function toJSON<T>(value: T): string {
  return JSON.stringify(value, (_key, value) =>
    typeof value === 'bigint' ? `__bigint__${value.toString()}` : value,
  );
}

function fromJSON<T>(json: string): T {
  return JSON.parse(json, (_key, value) =>
    typeof value === 'string' && value.startsWith('__bigint__')
      ? BigInt(value.slice(10))
      : value,
  );
}
