import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useCouponStore } from "../stores/useCouponStore";

export const useCouponsList = () => {
  const { coupons, loading, fetchCoupons, deleteCoupon, toggleCoupon } =
    useCouponStore();
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCopy = useCallback((code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã copy mã: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let expired = 0;
    let todayUses = 0;

    coupons.forEach((c) => {
      const isExp = new Date(c.expirationDate) < now;
      if (isExp) expired += 1;
      else if (c.isActive) active += 1;
      todayUses += c.usedToday || 0;
    });

    return {
      total: coupons.length,
      active,
      expired,
      todayUses,
    };
  }, [coupons]);

  const statCards = useMemo(
    () => [
      {
        label: "TỔNG MÃ GIẢM GIÁ",
        value: stats.total,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        label: "ĐANG KÍCH HOẠT",
        value: stats.active,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        label: "ĐÃ HẾT HẠN",
        value: stats.expired,
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
      {
        label: "LƯỢT DÙNG HÔM NAY",
        value: stats.todayUses,
        color: "text-luxury-gold",
        bg: "bg-luxury-gold/10",
      },
    ],
    [stats],
  );

  return {
    coupons,
    loading,
    copiedId,
    stats,
    statCards,
    handleCopy,
    deleteCoupon,
    toggleCoupon,
    refetch: () => fetchCoupons(true),
  };
};

export default useCouponsList;
