import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useProductsBulkSelect from './useProductsBulkSelect';

const sampleProducts = [
  { _id: 'p1', name: 'Product 1' },
  { _id: 'p2', name: 'Product 2' },
  { _id: 'p3', name: 'Product 3' },
];

describe('useProductsBulkSelect Hook', () => {
  describe('initialization', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should have toggle and clear methods', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      expect(typeof result.current.toggleSelect).toBe('function');
      expect(typeof result.current.toggleSelectAll).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.isSelected).toBe('function');
    });
  });

  describe('single selection', () => {
    it('should toggle select for single product', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelect('p1');
      });

      expect(result.current.isSelected('p1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });
  });

  describe('bulk operations', () => {
    it('should select all products on current page', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedCount).toBe(3);
      expect(result.current.allPageSelected).toBe(true);
    });

    it('should deselect all products', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelectAll();
        result.current.clearSelection();
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('should get selected as array', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelect('p1');
        result.current.toggleSelect('p2');
      });

      const selectedArray = result.current.getSelectedArray();

      expect(selectedArray).toContain('p1');
      expect(selectedArray).toContain('p2');
    });
  });

  describe('page selection state', () => {
    it('should track if all page items are selected', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.allPageSelected).toBe(true);
    });

    it('should track if some page items are selected', () => {
      const { result } = renderHook(() => useProductsBulkSelect(sampleProducts));

      act(() => {
        result.current.toggleSelect('p1');
      });

      expect(result.current.somePageSelected).toBe(true);
    });

    it('should clear other page selections', () => {
      const pageA = [{ _id: 'a1' }, { _id: 'a2' }];
      const pageB = [{ _id: 'b1' }];

      const { result, rerender } = renderHook(
        ({ products }) => useProductsBulkSelect(products),
        { initialProps: { products: pageA } }
      );

      act(() => {
        result.current.toggleSelect('a1');
        result.current.toggleSelect('a2');
      });

      rerender({ products: pageB });

      act(() => {
        result.current.toggleSelect('b1');
        result.current.clearOtherPages();
      });

      expect(result.current.isSelected('b1')).toBe(true);
      expect(result.current.isSelected('a1')).toBe(false);
    });
  });
});
