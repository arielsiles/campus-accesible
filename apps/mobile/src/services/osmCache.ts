// FR-805: Local cache for OSM data by geohash zone

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 200; // ~200 zones * ~250KB avg = ~50MB max
const GEOHASH_PRECISION = 4; // ~20km x 20km — coarse enough for caching

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  accessedAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * FR-805: Simple geohash for cache key — rounds coords to grid cells
 */
function geohashKey(lat: number, lng: number, type: string): string {
  const latBucket = Math.round(lat * Math.pow(10, GEOHASH_PRECISION));
  const lngBucket = Math.round(lng * Math.pow(10, GEOHASH_PRECISION));
  return `osm:${type}:${latBucket}:${lngBucket}`;
}

/**
 * FR-805: Get cached OSM data for a zone
 */
export function getCachedOsmData(
  lat: number,
  lng: number,
  type: string
): unknown | null {
  const key = geohashKey(lat, lng, type);
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  entry.accessedAt = Date.now();
  return entry.data;
}

/**
 * FR-805: Store OSM data in cache for a zone
 */
export function setCachedOsmData(
  lat: number,
  lng: number,
  type: string,
  data: unknown
): void {
  const key = geohashKey(lat, lng, type);

  // LRU eviction if at capacity
  if (cache.size >= MAX_CACHE_ENTRIES) {
    evictOldest();
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
    accessedAt: Date.now(),
  });
}

/**
 * FR-805: Evict oldest accessed entries to stay under limit
 */
function evictOldest(): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache.entries()) {
    if (entry.accessedAt < oldestTime) {
      oldestTime = entry.accessedAt;
      oldestKey = key;
    }
  }

  if (oldestKey) cache.delete(oldestKey);
}

/**
 * FR-805: Clear all OSM cache
 */
export function clearOsmCache(): void {
  cache.clear();
}

/**
 * FR-805: Get cache stats
 */
export function getOsmCacheStats(): { entries: number; maxEntries: number } {
  return { entries: cache.size, maxEntries: MAX_CACHE_ENTRIES };
}
