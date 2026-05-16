import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useProductsSearch from './useProductsSearch';

const wrapper = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useProductsSearch Hook', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProductsSearch(), { wrapper });

      expect(result.current.search).toBe('');
      expect(result.current.debouncedSearch).toBe('');
      expect(result.current.currentPage).toBe(1);
      expect(result.current.sortBy).toBe('name_asc');
    });
  });

  describe('search management', () => {
    it('should update search state', () => {
      const { result } = renderHook(() => useProductsSearch(), { wrapper });

      act(() => {
        result.current.setSearch('notebook');
      });

      expect(result.current.search).toBe('notebook');
    });

    it('should reset search', () => {
      const { result } = renderHook(() => useProductsSearch(), { wrapper });

      act(() => {
        result.current.setSearch('test');
        result.current.resetSearch();
      });

      expect(result.current.search).toBe('');
    });
  });

  describe('pagination', () => {
    it('should go to next and previous page', () => {
      const { result } = renderHook(() => useProductsSearch(), { wrapper });

      act(() => {
        result.current.nextPage();
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.prevPage();
      });
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('sorting', () => {
    it('should update sort option', () => {
      const { result } = renderHook(() => useProductsSearch(), { wrapper });

      act(() => {
        result.current.setSortBy('price_asc');
      });

      expect(result.current.sortBy).toBe('price_asc');
    });
  });
});
