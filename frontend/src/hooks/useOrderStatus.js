import { useState, useMemo } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const NEXT_STATUS_OPTIONS = {
  pending: ['confirmed', 'cancelled'],
  awaiting_verification: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
  returned: [],
  cancelled: [],
};

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  awaiting_verification: 'Chờ xác minh TT',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  return_requested: 'Yêu cầu trả hàng',
  returned: 'Đã trả hàng',
};

export default function useOrderStatus(initialOrder) {
  const [order, setOrder] = useState(initialOrder);
  const [statusChanging, setStatusChanging] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const nextOptions = useMemo(() => {
    return NEXT_STATUS_OPTIONS[order?.status] || [];
  }, [order?.status]);

  const performStatusUpdate = async (newStatus, onSaved) => {
    setStatusChanging(true);
    try {
      const res = await axios.patch(`/orders/${order._id}/status`, { status: newStatus });
      setOrder(res.data?.order || { ...order, status: newStatus });
      toast.success(`Đã chuyển sang "${STATUS_LABELS[newStatus] || newStatus}"`);
      if (onSaved) onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setStatusChanging(false);
      setConfirmConfig(null);
    }
  };

  const handleChangeStatus = (newStatus, onSaved) => {
    if (newStatus === order?.status) return;
    if (newStatus === 'cancelled') {
      setConfirmConfig({
        title: 'Hủy đơn hàng',
        message: `Bạn chắc chắn muốn hủy đơn #${order.orderCode}? Tồn kho sẽ được hoàn trả.`,
        variant: 'danger',
        confirmLabel: 'Hủy đơn',
        onConfirm: () => performStatusUpdate(newStatus, onSaved),
      });
    } else {
      performStatusUpdate(newStatus, onSaved);
    }
  };

  return {
    order,
    setOrder,
    nextOptions,
    statusChanging,
    confirmConfig,
    setConfirmConfig,
    handleChangeStatus,
    STATUS_LABELS,
  };
}
