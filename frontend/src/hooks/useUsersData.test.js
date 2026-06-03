import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import axios from "../lib/axios";
import useUsersData from "./useUsersData";

describe("useUsersData Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        users: [
          { _id: "1", name: "Admin", email: "a@test.com", role: "admin" },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useUsersData());

      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);
      expect(result.current.pagination.currentPage).toBe(1);
    });

    it("should fetch users when fetchUsers is called", async () => {
      const { result } = renderHook(() => useUsersData());

      await act(async () => {
        await result.current.fetchUsers(1, "", "");
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.users).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("should update search state", () => {
      const { result } = renderHook(() => useUsersData());

      act(() => {
        result.current.setSearch("admin");
      });

      expect(result.current.search).toBe("admin");
    });
  });
});
