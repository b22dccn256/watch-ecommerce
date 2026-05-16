/**
 * useProductsSearch Hook
 * 
 * Handles search, sort, pagination, and URL parameter synchronization for ProductsList.
 * Replaces mixed state management scattered throughout the component.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useProductsSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read from URL on mount
  const urlPage = parseInt(searchParams.get('page')) || 1;
  const urlSearch = searchParams.get('search') || '';
  const urlSort = searchParams.get('sort') || 'name_asc';

  const [search, setSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [sortBy, setSortBy] = useState(urlSort);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync with URL parameters
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) {
      params.set('page', currentPage);
    } else {
      params.delete('page');
    }

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    if (sortBy !== 'name_asc') {
      params.set('sort', sortBy);
    } else {
      params.delete('sort');
    }

    setSearchParams(params, { replace: true });
  }, [currentPage, debouncedSearch, sortBy, setSearchParams]);

  const resetSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setSortBy('name_asc');
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, page));
  };

  return {
    // State
    search,
    debouncedSearch,
    currentPage,
    sortBy,

    // Setters
    setSearch,
    setCurrentPage,
    setSortBy,

    // Helpers
    resetSearch,
    goToPage,
    nextPage: () => setCurrentPage((p) => p + 1),
    prevPage: () => setCurrentPage((p) => Math.max(1, p - 1)),
  };
};

export default useProductsSearch;
