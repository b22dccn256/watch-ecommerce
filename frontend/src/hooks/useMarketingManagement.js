import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';
import { confirmToast } from '../lib/confirmToast';
import { useCampaignStore } from '../stores/useCampaignStore';
import { useProductStore } from '../stores/useProductStore';

const INITIAL_FORM = {
  name: '',
  group: 'Entire Catalog',
  discountPercentage: '',
  startDate: '',
  endDate: '',
  isGlobal: true,
};

export const useMarketingManagement = () => {
  const { campaigns, fetchCampaigns, createCampaign, toggleCampaignStatus, deleteCampaign } = useCampaignStore();
  const { allProducts: products } = useProductStore();
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const bannersFetchRef = useRef({ promise: null, lastFetched: 0 });

  const fetchBanners = useCallback(
    async (force = false) => {
      const now = Date.now();
      const fetchState = bannersFetchRef.current;
      if (!force && fetchState.promise) return fetchState.promise;
      if (!force && now - fetchState.lastFetched < 30000 && banners.length > 0) return;

      setBannersLoading(true);
      fetchState.promise = (async () => {
        try {
          const res = await axios.get('/banners');
          setBanners(res.data);
        } catch {
          toast.error('Không thể tải danh sách banner');
        } finally {
          fetchState.lastFetched = Date.now();
          fetchState.promise = null;
          setBannersLoading(false);
        }
      })();
      return fetchState.promise;
    },
    [banners.length]
  );

  useEffect(() => {
    fetchCampaigns();
    fetchBanners();
  }, [fetchCampaigns, fetchBanners]);

  const handleCreateCampaign = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch');
      return;
    }
    if (!formData.discountPercentage || Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 99) {
      toast.error('Vui lòng nhập phần trăm giảm hợp lệ (1-99)');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      return;
    }

    const startDateObj = new Date(formData.startDate);
    const endDateObj = new Date(formData.endDate);
    const now = new Date();
    if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
      toast.error('Định dạng ngày không hợp lệ');
      return;
    }
    if (endDateObj <= startDateObj) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }
    if (startDateObj < now && startDateObj.getTime() < now.getTime() - 60000) {
      toast.error('Ngày bắt đầu không được trong quá khứ');
      return;
    }

    setCreating(true);
    const { success } = await createCampaign({
      ...formData,
      discountPercentage: Number(formData.discountPercentage),
      isGlobal: formData.group === 'Entire Catalog',
    });

    if (success) {
      setFormData(INITIAL_FORM);
      toast.success('Chiến dịch đã được tạo thành công!');
    }
    setCreating(false);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh phải nhỏ hơn 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const toastId = toast.loading('Đang tải banner lên...');
      try {
        const res = await axios.post('/banners', {
          title: file.name.replace(/\.[^.]+$/, ''),
          image: ev.target.result,
        });
        setBanners((prev) => [res.data, ...prev]);
        toast.success('Banner đã được tải lên!', { id: toastId });
      } catch {
        toast.error('Lỗi khi tải banner lên', { id: toastId });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteBanner = (id) => {
    confirmToast('Bạn có chắc chắn muốn xóa banner này?', async () => {
      try {
        await axios.delete(`/banners/${id}`);
        setBanners((prev) => prev.filter((b) => b._id !== id));
        toast.success('Đã xóa banner');
      } catch {
        toast.error('Không thể xóa banner');
      }
    });
  };

  const handleToggleBannerStatus = async (id) => {
    try {
      const res = await axios.patch(`/banners/${id}/toggle`);
      setBanners((prev) => prev.map((b) => (b._id === id ? res.data : b)));
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái banner');
    }
  };

  const handleReorderBanner = async (id, direction) => {
    const currentIndex = banners.findIndex((b) => b._id === id);
    if (currentIndex === -1) return;
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const reordered = [...banners];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];
    // Optimistic UI update
    setBanners(reordered);

    try {
      const orderedIds = reordered.map((b) => b._id);
      await axios.patch('/banners/reorder', { orderedIds });
    } catch {
      toast.error('Lỗi khi sắp xếp lại banner');
      // Revert on error
      setBanners(banners);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const previewProduct = products?.find((p) =>
    formData.group === 'Entire Catalog' ? true : p.category === formData.group
  );

  const activeCampaigns = campaigns?.filter((c) => c.status === 'Active').length || 0;

  return {
    campaigns,
    banners,
    bannersLoading,
    creating,
    formData,
    setFormData,
    bannerInputRef,
    handleCreateCampaign,
    handleBannerUpload,
    handleDeleteBanner,
    handleToggleBannerStatus,
    handleReorderBanner,
    toggleCampaignStatus,
    deleteCampaign,
    formatDate,
    previewProduct,
    activeCampaigns,
  };
};

export default useMarketingManagement;
