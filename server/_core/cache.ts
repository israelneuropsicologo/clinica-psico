/**
 * Cache System for AI Analytics
 * Provides in-memory caching with TTL support to reduce database queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all cache entries matching a pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() - entry.timestamp > entry.ttl,
      })),
    };
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.clear();
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache key generators for AI Analytics
 */
export const cacheKeys = {
  // Patient AI Insights
  patientInsights: (patientId: number) => `ai:insights:${patientId}`,
  
  // Session Planning Recommendations
  sessionPlanning: (patientId: number) => `ai:planning:${patientId}`,
  
  // Comparative Analysis
  comparativeAnalysis: (patientIds: number[]) => `ai:comparative:${patientIds.sort().join(',')}`,
  
  // Supervision Summary
  supervisionSummary: (patientId: number) => `ai:supervision:${patientId}`,
  
  // Patient list with filters
  patientList: (userId: number, filters: string) => `ai:patients:${userId}:${filters}`,
  
  // Analytics dashboard data
  dashboardData: (userId: number) => `ai:dashboard:${userId}`,
  
  // All patient insights for user
  allPatientInsights: (userId: number) => `ai:all-insights:${userId}`,
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all AI data for a patient
  invalidatePatient: (patientId: number) => {
    const patterns = [
      `ai:insights:${patientId}`,
      `ai:planning:${patientId}`,
      `ai:supervision:${patientId}`,
      `ai:comparative:.*${patientId}.*`,
    ];

    let count = 0;
    for (const pattern of patterns) {
      count += cacheManager.deletePattern(pattern);
    }

    return count;
  },

  // Invalidate all AI data for a user
  invalidateUser: (userId: number) => {
    const patterns = [
      `ai:patients:${userId}:.*`,
      `ai:dashboard:${userId}`,
      `ai:all-insights:${userId}`,
    ];

    let count = 0;
    for (const pattern of patterns) {
      count += cacheManager.deletePattern(pattern);
    }

    return count;
  },

  // Invalidate all cache
  invalidateAll: () => {
    cacheManager.clear();
  },
};
