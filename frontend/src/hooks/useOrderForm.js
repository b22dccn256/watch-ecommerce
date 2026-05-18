import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

export default function useOrderForm(initialOrder) {
  const [form, setForm] = useState({
    carrier: '',
    carrierTrackingNumber: '',
    refundAmount: '',
    internalNotes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      setForm({
        carrier: initialOrder?.carrier || '',
        carrierTrackingNumber: initialOrder?.carrierTrackingNumber || '',
        refundAmount: initialOrder?.refundAmount || '',
        internalNotes: initialOrder?.internalNotes || '',
      });
    }
  }, [initialOrder]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const saveDetails = async (orderId) => {
    if (!orderId) return;
    setSaving(true);
    try {
      await axios.patch(`/orders/${orderId}`, {
        carrier: form.carrier,
        carrierTrackingNumber: form.carrierTrackingNumber,
        refundAmount: form.refundAmount ? Number(form.refundAmount) : undefined,
        internalNotes: form.internalNotes,
      });
      toast.success('Đã lưu thay đổi');
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi lưu');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    handleChange,
    saveDetails,
    saving,
  };
}
