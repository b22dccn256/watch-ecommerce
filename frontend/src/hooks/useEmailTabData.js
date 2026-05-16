import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirmToast';

const DEFAULT_AUTOMATIONS = [
  { id: 'abandoned-cart', title: 'Abandoned Cart', desc: 'Tự động gửi email nhắc nhở sau 24h nếu giỏ hàng không trống.', active: true },
  { id: 'welcome-email', title: 'Welcome Email', desc: 'Gửi lời chào và mã giảm giá 10% khi khách đăng ký Newsletter.', active: true },
  { id: 'birthday-email', title: 'Birthday Email', desc: 'Tự động gửi lời chúc vào ngày sinh nhật khách hàng.', active: false },
];

export const useEmailTabData = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    messages: [],
    subscribers: [],
    campaigns: [],
    templates: [],
    stats: { openRate: 0, clickRate: 0, totalSent: 0, totalCampaigns: 0, sentEmails: 0 },
    chartData: [],
  });
  const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);
  const fetchStateRef = useRef({});

  const fetchData = useCallback(async () => {
    const tabState = fetchStateRef.current[activeTab] || { promise: null, lastFetched: 0 };
    fetchStateRef.current[activeTab] = tabState;
    const now = Date.now();
    if (tabState.promise) return tabState.promise;
    if (now - tabState.lastFetched < 15000) return;

    setLoading(true);
    tabState.promise = (async () => {
      try {
        if (activeTab === 'dashboard') {
          const res = await axios.get('/mail/stats?days=7');
          setData((prev) => ({ ...prev, stats: res.data.stats, chartData: res.data.chartData || [] }));
        } else if (activeTab === 'inbox') {
          const res = await axios.get('/mail/inbox');
          setData((prev) => ({ ...prev, messages: res.data.messages }));
        } else if (activeTab === 'subscribers') {
          const res = await axios.get('/mail/subscribers');
          setData((prev) => ({ ...prev, subscribers: res.data.subscribers }));
        } else if (activeTab === 'campaigns') {
          const res = await axios.get('/mail/campaigns');
          setData((prev) => ({ ...prev, campaigns: res.data.campaigns }));
        } else if (activeTab === 'templates') {
          const res = await axios.get('/mail/templates');
          setData((prev) => ({ ...prev, templates: res.data.templates }));
        }
      } catch (error) {
        console.error('Email tab fetch error:', error);
      } finally {
        tabState.lastFetched = Date.now();
        setLoading(false);
        fetchStateRef.current[activeTab].promise = null;
      }
    })();
    return tabState.promise;
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteSubscriber = (id, email) => {
    confirmToast(`Xóa subscriber "${email}"?`, async () => {
      try {
        await axios.delete(`/mail/subscribers/${id}`);
        setData((prev) => ({
          ...prev,
          subscribers: prev.subscribers.filter((s) => s._id !== id),
        }));
        toast.success('Đã xóa subscriber');
      } catch {
        toast.error('Không thể xóa subscriber');
      }
    });
  };

  const handleToggleAutomation = async (automationId) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === automationId ? { ...a, active: !a.active } : a))
    );
    try {
      await axios.patch(`/mail/automations/${automationId}/toggle`);
    } catch {
      setAutomations((prev) =>
        prev.map((a) => (a.id === automationId ? { ...a, active: !a.active } : a))
      );
      toast.error('Không thể cập nhật trạng thái automation');
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    data,
    automations,
    fetchData,
    handleDeleteSubscriber,
    handleToggleAutomation,
  };
};

export default useEmailTabData;
