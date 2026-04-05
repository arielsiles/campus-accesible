// FR-601: In-memory API cache with TTL and request deduplication

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30_000; // 30 seconds
const cache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * FR-601: Get cached response or null if expired/missing
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * FR-601: Store response in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * FR-601: Deduplicate concurrent requests to the same URL
 * Returns existing promise if request is already in-flight
 */
export async function dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

/**
 * FR-601: Cached GET request — checks cache first, deduplicates in-flight
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const result = await dedup(key, fetcher);
  setCache(key, result, ttlMs);
  return result;
}

/**
 * FR-601: Invalidate a specific cache key or all keys matching prefix
 */
export function invalidateCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * FR-601: Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; inflight: number } {
  return { size: cache.size, inflight: inflightRequests.size };
}
