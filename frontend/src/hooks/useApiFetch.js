/**
 * useApiFetch Hook
 *
 * Standardized async data fetching pattern for all components.
 * Handles loading, error, and success states consistently.
 *
 * Usage:
 * const { data, loading, error, fetch } = useApiFetch();
 *
 * useEffect(() => {
 *   fetch(async () => {
 *     const res = await api.get('/products');
 *     return res.data;
 *   });
 * }, []);
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useErrorHandler } from "./useErrorHandler";

/**
 * Hook for standardized API data fetching
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Automatically fetch on mount (default: false)
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @param {*} options.initialData - Initial data value
 * @returns {Object} - { data, loading, error, fetch, refetch, reset }
 */
export const useApiFetch = (options = {}) => {
  const { onSuccess, onError, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const { handleError } = useErrorHandler();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Execute async function and manage state
   * @param {Function} asyncFn - Async function that returns data
   * @param {Object} options - Fetch options
   */
  const fetch = useCallback(
    async (asyncFn, fetchOptions = {}) => {
      const { context = "API Fetch", showError = true } = fetchOptions;

      try {
        setLoading(true);
        setError(null);

        const result = await asyncFn();

        if (!isMountedRef.current) return;

        setData(result);
        setLoading(false);
        onSuccess?.(result);

        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorParsed = handleError(err, {
          context,
          showToast: showError,
          store: false,
        });

        setError(errorParsed);
        setLoading(false);
        onError?.(errorParsed);

        throw err;
      }
    },
    [handleError, onSuccess, onError],
  );

  /**
   * Refetch with same function
   */
  const refetch = useCallback(
    async (asyncFn) => {
      return fetch(asyncFn);
    },
    [fetch],
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    fetch,
    refetch,
    reset,
  };
};

/**
 * usePaginatedFetch Hook
 *
 * For fetching paginated data
 *
 * Usage:
 * const { items, page, totalPages, loading, fetch } = usePaginatedFetch();
 */
export const usePaginatedFetch = (options = {}) => {
  const { pageSize = 20, initialPage = 1 } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError } = useErrorHandler();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(
    async (asyncFn) => {
      try {
        setLoading(true);
        setError(null);

        const result = await asyncFn(page, pageSize);

        if (!isMountedRef.current) return;

        setItems(result.items || []);
        setTotalItems(result.total || 0);
        setLoading(false);

        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorParsed = handleError(err, {
          context: "Paginated Fetch",
          store: false,
        });

        setError(errorParsed);
        setLoading(false);
        throw err;
      }
    },
    [page, pageSize, handleError],
  );

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setTotalItems(0);
    setError(null);
  }, [initialPage]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    page,
    totalPages,
    totalItems,
    pageSize,
    loading,
    error,
    fetch,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
};

/**
 * useMutate Hook
 *
 * For mutations (POST, PUT, DELETE operations)
 *
 * Usage:
 * const { execute, loading, error } = useMutate();
 *
 * const handleSave = async () => {
 *   await execute(async () => {
 *     await api.post('/products', data);
 *   });
 * };
 */
export const useMutate = (options = {}) => {
  const { onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError } = useErrorHandler();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (asyncFn, execOptions = {}) => {
      const { context = "Mutation", showError = true } = execOptions;

      try {
        setLoading(true);
        setError(null);

        const result = await asyncFn();

        if (!isMountedRef.current) return;

        setLoading(false);
        onSuccess?.(result);

        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorParsed = handleError(err, {
          context,
          showToast: showError,
          store: false,
        });

        setError(errorParsed);
        setLoading(false);
        onError?.(errorParsed);

        throw err;
      }
    },
    [handleError, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    reset,
  };
};

export default useApiFetch;
