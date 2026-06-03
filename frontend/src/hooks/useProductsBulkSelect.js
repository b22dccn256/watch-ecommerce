/**
 * useProductsBulkSelect Hook
 *
 * Handles bulk product selection state and operations.
 * Replaces scattered bulk select logic in ProductsList.
 */

import { useState, useCallback, useMemo } from "react";

export const useProductsBulkSelect = (products = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // IDs on current page
  const currentPageIds = useMemo(() => {
    return products.map((p) => p._id);
  }, [products]);

  // Check if all on current page are selected
  const allPageSelected = useMemo(() => {
    return (
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedIds.has(id))
    );
  }, [currentPageIds, selectedIds]);

  // Check if some on current page are selected
  const somePageSelected = useMemo(() => {
    return (
      currentPageIds.length > 0 &&
      currentPageIds.some((id) => selectedIds.has(id)) &&
      !allPageSelected
    );
  }, [currentPageIds, selectedIds, allPageSelected]);

  // Toggle individual selection
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle select all on current page
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allPageSelected) {
        // Deselect all on current page
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        // Select all on current page
        currentPageIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }, [allPageSelected, currentPageIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Clear selections outside current page
  const clearOtherPages = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      // Keep only selections from current page
      next.forEach((id) => {
        if (!currentPageIds.includes(id)) {
          next.delete(id);
        }
      });
      return next;
    });
  }, [currentPageIds]);

  // Get selected count
  const selectedCount = selectedIds.size;
  const selectedOnPageCount = currentPageIds.filter((id) =>
    selectedIds.has(id),
  ).length;

  return {
    // State
    selectedIds,
    selectedCount,
    selectedOnPageCount,
    allPageSelected,
    somePageSelected,

    // Actions
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    clearOtherPages,

    // Helpers
    isSelected: (id) => selectedIds.has(id),
    getSelectedArray: () => Array.from(selectedIds),
  };
};

export default useProductsBulkSelect;
