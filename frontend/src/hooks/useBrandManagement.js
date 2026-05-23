import { useState, useCallback } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirmToast';
import { useErrorHandler } from './useErrorHandler';

const INITIAL_BRAND_FORM = {
  name: '',
  description: '',
  isAuthorizedDealer: true,
  logo: '',
};

export const useBrandManagement = ({ products, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [brandForm, setBrandForm] = useState(INITIAL_BRAND_FORM);
  const { handleError } = useErrorHandler();

  const processImage = useCallback((file, setFormState) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormState((prev) => ({ ...prev, image: reader.result, logo: reader.result }));
    reader.readAsDataURL(file);
  }, []);

  const resetBrandForm = useCallback(() => {
    setBrandForm(INITIAL_BRAND_FORM);
  }, []);

  const submitBrand = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.post('/brands', brandForm);
        toast.success('Tạo thương hiệu thành công!');
        resetBrandForm();
        await onRefresh?.();
        return true;
      } catch (error) {
        handleError(error, { context: 'useBrandManagement.submit', showToast: true });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [brandForm, handleError, onRefresh, resetBrandForm]
  );

  const deleteBrand = useCallback(
    (brandId, brandName) => {
      const productsUsing = products.filter((p) =>
        typeof p.brand === 'object' ? p.brand?._id === brandId : p.brand === brandId
      );
      if (productsUsing.length > 0) {
        toast.error(`Có ${productsUsing.length} sản phẩm đang dùng thương hiệu này. Không thể xóa!`);
        return;
      }
      confirmToast(`Bạn có chắc muốn xóa thương hiệu ${brandName}?`, async () => {
        setLoading(true);
        try {
          await axios.delete(`/brands/${brandId}`);
          toast.success('Đã xóa thương hiệu');
          await onRefresh?.();
        } catch (error) {
          handleError(error, { context: 'useBrandManagement.delete', showToast: true });
        } finally {
          setLoading(false);
        }
      });
    },
    [products, handleError, onRefresh]
  );

  const updateBrand = useCallback(
    async (brandId, e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.put(`/brands/${brandId}`, brandForm);
        toast.success('Cập nhật thương hiệu thành công!');
        resetBrandForm();
        await onRefresh?.();
        return true;
      } catch (error) {
        handleError(error, { context: 'useBrandManagement.update', showToast: true });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [brandForm, handleError, onRefresh, resetBrandForm]
  );

  const startEditBrand = useCallback((brand) => {
    setBrandForm({
      name: brand.name || '',
      description: brand.description || '',
      isAuthorizedDealer: brand.isAuthorizedDealer !== false,
      logo: brand.logo || '',
    });
  }, []);

  return {
    loading,
    brandForm,
    setBrandForm,
    processImage,
    submitBrand,
    updateBrand,
    deleteBrand,
    startEditBrand,
    resetBrandForm,
  };
};

export default useBrandManagement;
