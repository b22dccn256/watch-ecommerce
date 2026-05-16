import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useErrorHandler } from './useErrorHandler';

export const useOrdersList = ({ page = 1, limit = 20 } = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { handleError } = useErrorHandler();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/orders', { params: { page, limit } });
      setOrders(Array.isArray(res.data) ? res.data : res.data?.orders || []);
    } catch (error) {
      handleError(error, {
        context: 'useOrdersList.fetch',
        showToast: true,
        toastMessage: 'Không thể tải danh sách đơn hàng',
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, handleError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const s = search.toLowerCase();
    return orders.filter(
      (o) =>
        (o.orderCode || '').toLowerCase().includes(s) ||
        (o.shippingDetails?.phoneNumber || '').toLowerCase().includes(s) ||
        (o.user?.email || '').toLowerCase().includes(s)
    );
  }, [orders, search]);

  const exportCsv = useCallback(() => {
    if (!filteredOrders.length) {
      toast('Không có đơn để xuất');
      return;
    }
    const rows = ['Mã Đơn,Khách hàng,Tổng tiền,Trạng thái'];
    filteredOrders.forEach((o) => {
      rows.push(
        [
          o.orderCode || o._id,
          o.shippingDetails?.fullName || o.user?.name || 'N/A',
          o.totalAmount || '',
          o.status || '',
        ]
          .map(String)
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(',')
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredOrders]);

  return {
    orders: filteredOrders,
    loading,
    search,
    setSearch,
    fetchOrders,
    exportCsv,
  };
};

export default useOrdersList;
