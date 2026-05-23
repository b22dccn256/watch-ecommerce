import { useState, useCallback, useEffect, useRef } from 'react';
import axios from '../lib/axios';
import { useUserStore } from '../stores/useUserStore';

/**
 * Hook quản lý dashboard alerts, notifications cho AdminPage.
 * Chỉ fetch khi user đã xác thực (có token).
 * Tách logic ra khỏi AdminPage component để giảm kích thước và dễ test.
 */
export function useDashboardAlerts() {
  const { user } = useUserStore();
  const [tasks, setTasks] = useState({
    pendingOrders: 0,
    lowStock: 0,
    pendingReviews: 0,
    unansweredQuestions: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Prevent duplicate concurrent fetches
  const fetchRef = useRef({ promise: null, lastFetched: 0 });

  const fetchDashboardAlerts = useCallback(async () => {
    // Only fetch when user is authenticated (prevents 401 spam)
    if (!user) return;

    const now = Date.now();
    const fs = fetchRef.current;

    // Guard: skip if a fetch is already in-flight or within 15s cooldown
    if (fs.promise) return fs.promise;
    if (now - fs.lastFetched < 15000) return;

    fs.promise = Promise.allSettled([
      axios.get('/orders?status=pending&limit=5'),
      axios.get('/products/inventory/alerts?limit=3'),
      axios.get('/reviews?status=pending&limit=1'),
      axios.get('/questions?answered=false&limit=1'),
    ]).then(([ordersRes, inventoryRes, reviewsRes, questionsRes]) => {
      setTasks({
        pendingOrders:       ordersRes.status === 'fulfilled'   ? (ordersRes.value.data?.pagination?.totalOrders  || 0) : 0,
        lowStock:            inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data?.totalAlerts           || 0) : 0,
        pendingReviews:      reviewsRes.status === 'fulfilled'   ? (reviewsRes.value.data?.pagination?.totalReviews || 0) : 0,
        unansweredQuestions: questionsRes.status === 'fulfilled' ? (questionsRes.value.data?.totalQuestions        || 0) : 0,
      });

      const notifs = [];
      if (ordersRes.status === 'fulfilled') {
        (ordersRes.value.data?.orders || []).slice(0, 5).forEach(o =>
          notifs.push({
            id: o._id,
            type: 'order',
            title: 'Đơn hàng mới chờ xử lý',
            desc: '#' + (o.orderCode || o._id?.slice(0, 8).toUpperCase()) + ' — ' + (o.shippingDetails?.fullName || ''),
            time: o.createdAt,
            tab: 'orders',
          })
        );
      }
      if (inventoryRes.status === 'fulfilled') {
        (inventoryRes.value.data?.products || []).slice(0, 3).forEach(p =>
          notifs.push({
            id: 'inv_' + p._id,
            type: 'inventory',
            title: 'Hàng sắp hết kho',
            desc: (p.name || 'Sản phẩm') + ' — còn ' + p.stock + ' cái',
            time: new Date().toISOString(),
            tab: 'inventory',
          })
        );
      }

      setNotifications(notifs);
      setNotifCount(notifs.length);
    }).catch(() => {
      // Silently ignore auth errors — user may not be logged in yet
    }).finally(() => {
      fs.lastFetched = Date.now();
      fs.promise = null;
    });

    return fs.promise;
  }, [user]);

  // Initial fetch + 30s polling (only when user is authenticated)
  useEffect(() => {
    if (!user) return;
    fetchDashboardAlerts();
    const interval = setInterval(fetchDashboardAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardAlerts, user]);

  const markAllRead = useCallback(() => {
    setNotifications([]);
    setNotifCount(0);
    setNotifOpen(false);
  }, []);

  return {
    tasks,
    notifications,
    notifCount,
    notifOpen,
    setNotifOpen,
    markAllRead,
    refetch: fetchDashboardAlerts,
  };
}

export default useDashboardAlerts;
