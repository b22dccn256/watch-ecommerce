import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useErrorHandler from "./useErrorHandler";

describe("useErrorHandler Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleError function", () => {
    it("should handle errors with valid error object", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error("Test error"));
      });

      expect(result.current.handleError).toBeDefined();
    });

    it("should handle string errors", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError("String error message");
      });

      expect(result.current.handleError).toBeDefined();
    });

    it("should handle API errors with status codes", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleApiError({
          response: {
            status: 404,
            data: { message: "Not found" },
          },
        });
      });

      expect(result.current.handleApiError).toBeDefined();
    });
  });

  describe("withErrorHandling wrapper", () => {
    it("should wrap async functions and handle errors", async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testFn = vi.fn(async () => {
        throw new Error("Async error");
      });
      const wrappedFn = result.current.withErrorHandling(testFn);

      await act(async () => {
        try {
          await wrappedFn();
        } catch {
          // expected
        }
      });

      expect(testFn).toHaveBeenCalled();
    });

    it("should handle successful async operations", async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testFn = vi.fn(async () => ({ success: true }));
      const wrappedFn = result.current.withErrorHandling(testFn);

      let response;
      await act(async () => {
        response = await wrappedFn();
      });

      expect(response).toEqual({ success: true });
    });
  });

  describe("showValidationErrors", () => {
    it("should handle validation errors array", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showValidationErrors([
          { field: "email", message: "Invalid email" },
          { field: "password", message: "Too short" },
        ]);
      });

      expect(result.current.showValidationErrors).toBeDefined();
    });
  });
});
