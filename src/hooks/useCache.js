"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Custom hook สำหรับจัดการ cache และ data fetching
export const useCache = (key, defaultValue = null) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef(new Map());
  const requestsInFlight = useRef(new Map());

  const fetchData = useCallback(
    async (fetchFunction, cacheKey = key, forceRefresh = false) => {
      // ใช้ cache ถ้ามีและไม่ได้บังคับ refresh
      if (!forceRefresh && cache.current.has(cacheKey)) {
        const cachedData = cache.current.get(cacheKey);
        setData(cachedData);
        return cachedData;
      }

      // ถ้ามี request อยู่แล้ว ให้รอ request นั้นเสร็จ
      if (requestsInFlight.current.has(cacheKey)) {
        return requestsInFlight.current.get(cacheKey);
      }

      setLoading(true);
      setError(null);

      const promise = (async () => {
        try {
          const result = await fetchFunction();
          if (result.success) {
            cache.current.set(cacheKey, result.data);
            setData(result.data);
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          console.error(`Cache fetch error for ${cacheKey}:`, err);
          setError(err.message);
          throw err;
        } finally {
          setLoading(false);
          requestsInFlight.current.delete(cacheKey);
        }
      })();

      requestsInFlight.current.set(cacheKey, promise);
      return promise;
    },
    [key]
  );

  const clearCache = useCallback((cacheKey = null) => {
    if (cacheKey) {
      cache.current.delete(cacheKey);
    } else {
      cache.current.clear();
    }
  }, []);

  const invalidateCache = useCallback(
    (cacheKey = key) => {
      cache.current.delete(cacheKey);
    },
    [key]
  );

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache,
    invalidateCache,
    setData,
  };
};

// Hook สำหรับ debounce
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook สำหรับ async operation ที่มี loading state
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute, setError };
};

// Hook สำหรับ pagination
export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = useCallback(
    (page) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

export default useCache;
