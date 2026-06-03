/**
 * useProductsList Hook
 *
 * Handles all product list operations: fetching, CRUD, and state management.
 * Replaces direct API calls scattered throughout ProductsList component.
 */

import { useCallback } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useErrorHandler } from "./useErrorHandler";
import toast from "react-hot-toast";

export const useProductsList = () => {
  const {
    products,
    totalPages,
    currentPage,
    totalCount,
    loading,
    fetchProductsAdminPaginated,
    deleteProduct,
    toggleFeaturedProduct,
  } = useProductStore();

  const { handleError } = useErrorHandler();

  /**
   * Fetch products with pagination and filters
   */
  const fetchProducts = useCallback(
    async (params = {}) => {
      const { page = 1, limit = 20, search = "", sort = "name_asc" } = params;

      try {
        await fetchProductsAdminPaginated({
          page,
          limit,
          search,
          sort,
        });
      } catch (error) {
        handleError(error, {
          context: "ProductsList.fetchProducts",
          showToast: true,
        });
      }
    },
    [fetchProductsAdminPaginated, handleError],
  );

  /**
   * Delete a single product
   */
  const handleDeleteProduct = useCallback(
    async (productId) => {
      try {
        await deleteProduct(productId);
        toast.success("Xóa sản phẩm thành công");
        return true;
      } catch (error) {
        handleError(error, {
          context: "ProductsList.deleteProduct",
          showToast: true,
        });
        return false;
      }
    },
    [deleteProduct, handleError],
  );

  /**
   * Bulk delete products
   */
  const handleBulkDelete = useCallback(
    async (productIds) => {
      if (!productIds || productIds.length === 0) {
        toast.error("Chưa chọn sản phẩm để xóa");
        return false;
      }

      try {
        let successCount = 0;
        let errorCount = 0;

        for (const id of productIds) {
          try {
            await deleteProduct(id);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Failed to delete product ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`Xóa thành công ${successCount} sản phẩm`);
        }
        if (errorCount > 0) {
          toast.error(`Lỗi khi xóa ${errorCount} sản phẩm`);
        }

        return successCount > 0;
      } catch (error) {
        handleError(error, {
          context: "ProductsList.bulkDelete",
          showToast: true,
        });
        return false;
      }
    },
    [deleteProduct, handleError],
  );

  /**
   * Toggle featured status for a product
   */
  const handleToggleFeatured = useCallback(
    async (productId, currentFeatured) => {
      try {
        await toggleFeaturedProduct(productId, !currentFeatured);
        const status = !currentFeatured ? "featured" : "không featured";
        toast.success(`Cập nhật trạng thái ${status}`);
        return true;
      } catch (error) {
        handleError(error, {
          context: "ProductsList.toggleFeatured",
          showToast: true,
        });
        return false;
      }
    },
    [toggleFeaturedProduct, handleError],
  );

  /**
   * Bulk toggle featured status
   */
  const handleBulkToggleFeatured = useCallback(
    async (productIds, shouldFeature) => {
      if (!productIds || productIds.length === 0) {
        toast.error("Chưa chọn sản phẩm");
        return false;
      }

      try {
        let successCount = 0;

        for (const id of productIds) {
          try {
            await toggleFeaturedProduct(id, shouldFeature);
            successCount++;
          } catch (error) {
            console.error(`Failed to toggle featured for ${id}:`, error);
          }
        }

        if (successCount > 0) {
          const action = shouldFeature ? "Nâng cấp" : "Hạ cấp";
          toast.success(`${action} thành công ${successCount} sản phẩm`);
          return true;
        }

        return false;
      } catch (error) {
        handleError(error, {
          context: "ProductsList.bulkToggleFeatured",
          showToast: true,
        });
        return false;
      }
    },
    [toggleFeaturedProduct, handleError],
  );

  return {
    // State
    products: products || [],
    loading,
    totalPages: totalPages || 1,
    currentPage: currentPage || 1,
    totalCount: totalCount || 0,

    // Actions
    fetchProducts,
    deleteProduct: handleDeleteProduct,
    bulkDelete: handleBulkDelete,
    toggleFeatured: handleToggleFeatured,
    bulkToggleFeatured: handleBulkToggleFeatured,
  };
};

export default useProductsList;
