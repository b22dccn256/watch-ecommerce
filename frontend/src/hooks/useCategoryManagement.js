import { useState, useCallback } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirmToast';
import { useErrorHandler } from './useErrorHandler';

const INITIAL_CAT_FORM = {
  name: '',
  parentCategory: '',
  image: '',
  slug: '',
};

export const generateCategorySlug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const useCategoryManagement = ({ categories, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [catForm, setCatForm] = useState(INITIAL_CAT_FORM);
  const { handleError } = useErrorHandler();

  const processImage = useCallback((file, setFormState) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormState((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  }, []);

  const resetCatForm = useCallback(() => {
    setCatForm(INITIAL_CAT_FORM);
  }, []);

  const submitCategory = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.post('/categories', {
          ...catForm,
          parentCategory: catForm.parentCategory || null,
          slug: catForm.slug || generateCategorySlug(catForm.name),
        });
        toast.success('Tạo danh mục thành công!');
        resetCatForm();
        await onRefresh?.();
        return true;
      } catch (error) {
        handleError(error, { context: 'useCategoryManagement.submit', showToast: true });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [catForm, handleError, onRefresh, resetCatForm]
  );

  const deleteCategory = useCallback(
    (catId, catName) => {
      confirmToast(`Xóa danh mục ${catName}?`, async () => {
        setLoading(true);
        try {
          await axios.delete(`/categories/${catId}`);
          toast.success('Đã xóa danh mục');
          await onRefresh?.();
        } catch (error) {
          handleError(error, { context: 'useCategoryManagement.delete', showToast: true });
        } finally {
          setLoading(false);
        }
      });
    },
    [handleError, onRefresh]
  );

  const updateCategory = useCallback(
    async (catId, e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.put(`/categories/${catId}`, {
          ...catForm,
          parentCategory: catForm.parentCategory || null,
          slug: catForm.slug || generateCategorySlug(catForm.name),
        });
        toast.success('Cập nhật danh mục thành công!');
        resetCatForm();
        await onRefresh?.();
        return true;
      } catch (error) {
        handleError(error, { context: 'useCategoryManagement.update', showToast: true });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [catForm, handleError, onRefresh, resetCatForm]
  );

  const startEditCategory = useCallback((cat) => {
    setCatForm({
      name: cat.name || '',
      parentCategory: cat.parentCategory?._id || cat.parentCategory || '',
      image: cat.image || '',
      slug: cat.slug || '',
    });
  }, []);

  const rootCategories = categories?.filter((c) => !c.parentCategory) || [];

  return {
    loading,
    catForm,
    setCatForm,
    processImage,
    submitCategory,
    updateCategory,
    deleteCategory,
    startEditCategory,
    resetCatForm,
    rootCategories,
    generateCategorySlug,
  };
};

export default useCategoryManagement;
