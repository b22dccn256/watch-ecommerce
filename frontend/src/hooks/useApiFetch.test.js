import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useApiFetch, { usePaginatedFetch, useMutate } from './useApiFetch';

describe('useApiFetch Hooks', () => {
  describe('useApiFetch', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useApiFetch());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should expose fetch, refetch, and reset methods', () => {
      const { result } = renderHook(() => useApiFetch());

      expect(typeof result.current.fetch).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should handle data fetching', async () => {
      const mockData = { products: [] };
      const { result } = renderHook(() => useApiFetch());

      await act(async () => {
        await result.current.fetch(async () => mockData);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should reset state', () => {
      const { result } = renderHook(() => useApiFetch({ initialData: { ok: true } }));

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toEqual({ ok: true });
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('usePaginatedFetch', () => {
    it('should initialize pagination state', () => {
      const { result } = renderHook(() => usePaginatedFetch());

      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(0);
      expect(typeof result.current.goToPage).toBe('function');
    });

    it('should support pagination methods', () => {
      const { result } = renderHook(() => usePaginatedFetch());

      expect(typeof result.current.nextPage).toBe('function');
      expect(typeof result.current.prevPage).toBe('function');
      expect(typeof result.current.goToPage).toBe('function');
    });
  });

  describe('useMutate', () => {
    it('should initialize mutation state', () => {
      const { result } = renderHook(() => useMutate());

      expect(result.current.loading).toBe(false);
      expect(typeof result.current.execute).toBe('function');
    });

    it('should handle mutations', async () => {
      const { result } = renderHook(() => useMutate());
      const mutation = vi.fn().mockResolvedValue({ id: 1 });

      await act(async () => {
        await result.current.execute(mutation);
      });

      expect(mutation).toHaveBeenCalled();
    });
  });
});
