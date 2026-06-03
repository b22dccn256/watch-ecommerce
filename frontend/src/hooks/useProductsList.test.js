import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useProductsList from "./useProductsList";

vi.mock("../stores/useProductStore", () => {
  const state = {
    products: [],
    totalPages: 1,
    currentPage: 1,
    totalCount: 0,
    loading: false,
    fetchProductsAdminPaginated: vi.fn().mockResolvedValue(undefined),
    deleteProduct: vi.fn().mockResolvedValue(undefined),
    toggleFeaturedProduct: vi.fn().mockResolvedValue(undefined),
  };
  const useProductStore = (selector) => {
    if (typeof selector === "function") return selector(state);
    return state;
  };
  useProductStore.getState = () => state;
  return { useProductStore };
});

describe("useProductsList Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with empty state", () => {
      const { result } = renderHook(() => useProductsList());

      expect(result.current.products).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("fetchProducts", () => {
    it("should call store fetch with params", async () => {
      const { useProductStore } = await import("../stores/useProductStore");
      const { result } = renderHook(() => useProductsList());

      await act(async () => {
        await result.current.fetchProducts({ page: 2, search: "watch" });
      });

      expect(
        useProductStore.getState().fetchProductsAdminPaginated,
      ).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "watch",
        sort: "name_asc",
      });
    });
  });
});
