import { useEffect, useState, useRef, useCallback } from "react";
import axios from "../lib/axios";

/**
 * Hook quản lý toàn bộ data fetching cho AnalyticsTab.
 * Tách logic ra khỏi component để dễ test và tái sử dụng.
 */
export const useAnalyticsData = () => {
  const [data, setData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
    aov: 0,
    totalOrdersPlaced: 0,
    conversionRate: 0,
    pendingRevenue: 0,
    pendingCount: 0,
    cancellationRate: 0,
    paymentStats: [],
    wristSizeStats: [],
    watchTypeStats: [],
    dialColorStats: [],
    categoryStats: [],
    recentPendingOrders: [],
  });
  const [prevData, setPrevData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [days, setDays] = useState(7);
  const [topProducts, setTopProducts] = useState([]);
  const [bottomProducts, setBottomProducts] = useState([]);
  const [plData, setPlData] = useState(null);

  // Prevent duplicate concurrent fetches
  const fetchRef = useRef({ promise: null, lastFetched: 0, lastDays: null });

  const fetchAnalytics = useCallback(async () => {
    const now = Date.now();
    const fs = fetchRef.current;
    if (fs.promise) return;
    if (fs.lastDays === days && now - fs.lastFetched < 15000) return;

    setIsLoading(true);
    fs.promise = (async () => {
      try {
        const [cur, topRes, botRes] = await Promise.allSettled([
          axios.get(`/analytics?days=${days}&includePrev=true`),
          axios.get(`/products?sort=best_selling&limit=8`),
          axios.get(`/products/inventory/alerts?limit=8`),
        ]);

        if (cur.status === "fulfilled") {
          const d = cur.value.data;
          const ps = (d.dailySales || []).reduce((s, x) => s + x.sales, 0);
          const pr = (d.dailySales || []).reduce((s, x) => s + x.revenue, 0);
          setData({
            users: d.users,
            products: d.products,
            totalSales: ps,
            totalRevenue: pr,
            aov: ps > 0 ? Math.round(pr / ps) : 0,
            totalOrdersPlaced: ps, // Synchronized with totalSales (ps)
            conversionRate: d.conversionRate || 0,
            pendingRevenue: d.pendingRevenue || 0,
            pendingCount: d.pendingCount || 0,
            cancellationRate: d.cancellationRate || 0,
            paymentStats: d.paymentStats || [],
            wristSizeStats: d.wristSizeStats || [],
            watchTypeStats: d.watchTypeStats || [],
            dialColorStats: d.dialColorStats || [],
            categoryStats: d.categoryStats || [],
            recentPendingOrders: d.recentPendingOrders || [],
          });
          setDailySalesData(d.dailySales || []);

          if (d.prevDailySales) {
            const pvs = d.prevDailySales.reduce((s, x) => s + x.sales, 0);
            const pvr = d.prevDailySales.reduce((s, x) => s + x.revenue, 0);
            setPrevData({
              totalRevenue: pvr,
              totalSales: pvs,
              aov: pvs > 0 ? Math.round(pvr / pvs) : 0,
            });
          }
        }

        if (topRes.status === "fulfilled") {
          setTopProducts(topRes.value.data?.products?.slice(0, 8) || []);
        }
        if (botRes.status === "fulfilled") {
          setBottomProducts(botRes.value.data?.products?.slice(0, 8) || []);
        }

        try {
          const pl = await axios.get(`/analytics/pl?days=${days}`);
          setPlData(pl.data);
        } catch {
          // P&L is non-critical, silently fail
        }
      } catch (e) {
        console.error("[useAnalyticsData] fetch error:", e);
      } finally {
        fs.lastFetched = Date.now();
        fs.lastDays = days;
        fs.promise = null;
        setIsLoading(false);
      }
    })();
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getDelta = useCallback((cur, prev) => {
    if (!prev || prev === 0) return null;
    const d = ((cur - prev) / prev) * 100;
    return { delta: d.toFixed(1), positive: d >= 0 };
  }, []);

  const exportCsv = useCallback(() => {
    if (!dailySalesData.length) return;
    const csv = [
      "Ngày,Đơn hàng,Doanh thu",
      ...dailySalesData.map((d) => `${d.name},${d.sales},${d.revenue}`),
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv" }),
      ),
      download: `analytics_${days}d_${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
  }, [dailySalesData, days]);

  const hasChart = dailySalesData.some((d) => d.sales > 0 || d.revenue > 0);
  const revDelta = prevData
    ? getDelta(data.totalRevenue, prevData.totalRevenue)
    : null;
  const saleDelta = prevData
    ? getDelta(data.totalSales, prevData.totalSales)
    : null;

  return {
    data,
    isLoading,
    dailySalesData,
    days,
    setDays,
    topProducts,
    bottomProducts,
    plData,
    hasChart,
    revDelta,
    saleDelta,
    exportCsv,
  };
};

export default useAnalyticsData;
