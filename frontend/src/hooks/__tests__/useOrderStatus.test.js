import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import useOrderStatus from "../useOrderStatus";

// Mock axios
vi.mock("../../lib/axios");
vi.mock("react-hot-toast");

describe("useOrderStatus Hook", () => {
  const mockOrder = {
    _id: "order-123",
    orderCode: "ORD-001",
    status: "pending",
  };

  it("initializes order state", () => {
    const { result } = renderHook(() => useOrderStatus(mockOrder));

    expect(result.current.order._id).toBe("order-123");
    expect(result.current.order.status).toBe("pending");
  });

  it("gets next options for pending order", () => {
    const { result } = renderHook(() => useOrderStatus(mockOrder));

    expect(result.current.nextOptions).toContain("confirmed");
    expect(result.current.nextOptions).toContain("cancelled");
  });

  it("statusChanging starts as false", () => {
    const { result } = renderHook(() => useOrderStatus(mockOrder));

    expect(result.current.statusChanging).toBe(false);
  });

  it("confirmConfig starts as null", () => {
    const { result } = renderHook(() => useOrderStatus(mockOrder));

    expect(result.current.confirmConfig).toBeNull();
  });

  it("has STATUS_LABELS available", () => {
    const { result } = renderHook(() => useOrderStatus(mockOrder));

    expect(result.current.STATUS_LABELS.pending).toBe("Chờ xử lý");
    expect(result.current.STATUS_LABELS.confirmed).toBe("Đã xác nhận");
  });

  it("no next options for cancelled order", () => {
    const cancelledOrder = { ...mockOrder, status: "cancelled" };
    const { result } = renderHook(() => useOrderStatus(cancelledOrder));

    expect(result.current.nextOptions.length).toBe(0);
  });
});
