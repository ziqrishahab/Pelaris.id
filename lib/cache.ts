/**
 * API Response Cache
 * 
 * Simple in-memory cache for API responses to reduce redundant requests.
 * Uses stale-while-revalidate pattern for better UX.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 2 * 60 * 1000, // 2 minutes  
  LONG: 10 * 60 * 1000,  // 10 minutes
} as const;

/**
 * Generate cache key from URL and params
 */
export function getCacheKey(url: string, params?: Record<string, unknown>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}:${paramString}`;
}

/**
 * Get cached data if valid
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Check if cache is stale but not expired
 * Useful for stale-while-revalidate pattern
 */
export function isCacheStale(key: string, staleThreshold: number = CACHE_TTL.SHORT): boolean {
  const entry = cache.get(key);
  if (!entry) return true;
  
  const age = Date.now() - entry.timestamp;
  return age > staleThreshold;
}

/**
 * Set cache data
 */
export function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Delete specific cache entry
 */
export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries matching a pattern
 */
export function clearCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get or fetch with cache
 * Implements stale-while-revalidate pattern
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
  }
): Promise<T> {
  const { ttl = CACHE_TTL.MEDIUM, staleWhileRevalidate = true } = options ?? {};
  
  // Check cache first
  const cached = getCache<T>(key);
  
  if (cached !== null) {
    // If stale-while-revalidate is enabled and cache is stale, refetch in background
    if (staleWhileRevalidate && isCacheStale(key)) {
      // Revalidate in background (fire and forget)
      fetchFn().then(data => setCache(key, data, ttl)).catch(() => {});
    }
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  setCache(key, data, ttl);
  return data;
}

/**
 * Invalidate cache when data changes
 * Call this after mutations (create, update, delete)
 */
export function invalidateCache(patterns: string[]): void {
  for (const pattern of patterns) {
    clearCachePattern(pattern);
  }
}

// Cache invalidation patterns for common entities
export const CachePatterns = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  TRANSACTIONS: '/transactions',
  STOCK: '/stock',
  USERS: '/users',
  SETTINGS: '/settings',
} as const;
