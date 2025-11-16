import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 60 * 1000; // 1 minute

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { 
    cacheDuration?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    cacheDuration = CACHE_DURATION,
    autoRefresh = false,
    refreshInterval = 30 * 1000, // 30 seconds
  } = options;

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cached = cache.get(key);
      const now = Date.now();

      if (cached && now - cached.timestamp < cacheDuration) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }

      // Fetch new data
      setLoading(true);
      const result = await fetcher();
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: now,
      });

      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error(`[useCache] Error fetching ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cacheDuration]);

  useEffect(() => {
    fetchData();

    // Auto refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}
