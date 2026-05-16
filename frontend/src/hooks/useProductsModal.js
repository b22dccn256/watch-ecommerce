/**
 * useProductsModal Hook
 * 
 * Orchestrates all modal operations for ProductsList.
 * Replaces scattered modal useState calls.
 */

import useModalStore from '../stores/useModalStore';

export const useProductsModal = () => {
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const isOpen = useModalStore((state) => state.isOpen);
  const getModalData = useModalStore((state) => state.getModalData);
  const updateModalData = useModalStore((state) => state.updateModalData);

  // Create Product Modal
  const openCreateModal = () => openModal('createProduct');
  const closeCreateModal = () => closeModal('createProduct');
  const isCreateOpen = () => isOpen('createProduct');

  // Edit Product Modal
  const openEditModal = (product) => openModal('editProduct', product);
  const closeEditModal = () => closeModal('editProduct');
  const isEditOpen = () => isOpen('editProduct');
  const getEditingProduct = () => getModalData('editProduct');
  const updateEditingProduct = (data) => updateModalData('editProduct', data);

  // Import Products Modal
  const openImportModal = () => openModal('importProducts');
  const closeImportModal = () => closeModal('importProducts');
  const isImportOpen = () => isOpen('importProducts');
  const getImportData = () => getModalData('importProducts');
  const setImportPreview = (preview) =>
    updateModalData('importProducts', { preview });
  const setImportFile = (file) => updateModalData('importProducts', { file });

  // Campaign Picker Modal (for bulk operations)
  const openCampaignPicker = () => openModal('campaignPicker');
  const closeCampaignPicker = () => closeModal('campaignPicker');
  const isCampaignPickerOpen = () => isOpen('campaignPicker');

  // Price Adjust Modal (for bulk operations)
  const openPriceAdjustModal = () => openModal('priceAdjust');
  const closePriceAdjustModal = () => closeModal('priceAdjust');
  const isPriceAdjustOpen = () => isOpen('priceAdjust');

  // Delete Confirmation Modal
  const openDeleteConfirm = (product) =>
    openModal('deleteConfirm', { product });
  const closeDeleteConfirm = () => closeModal('deleteConfirm');
  const isDeleteConfirmOpen = () => isOpen('deleteConfirm');
  const getProductToDelete = () => getModalData('deleteConfirm')?.product;

  // Bulk Delete Confirmation Modal
  const openBulkDeleteConfirm = (count) =>
    openModal('bulkDeleteConfirm', { count });
  const closeBulkDeleteConfirm = () => closeModal('bulkDeleteConfirm');
  const isBulkDeleteConfirmOpen = () => isOpen('bulkDeleteConfirm');
  const getBulkDeleteCount = () => getModalData('bulkDeleteConfirm')?.count;

  // Close all modals at once
  const closeAllModals = () => {
    closeCreateModal();
    closeEditModal();
    closeImportModal();
    closeCampaignPicker();
    closePriceAdjustModal();
    closeDeleteConfirm();
    closeBulkDeleteConfirm();
  };

  return {
    // Create Modal
    openCreateModal,
    closeCreateModal,
    isCreateOpen,

    // Edit Modal
    openEditModal,
    closeEditModal,
    isEditOpen,
    getEditingProduct,
    updateEditingProduct,

    // Import Modal
    openImportModal,
    closeImportModal,
    isImportOpen,
    getImportData,
    setImportPreview,
    setImportFile,

    // Campaign Picker
    openCampaignPicker,
    closeCampaignPicker,
    isCampaignPickerOpen,

    // Price Adjust Modal
    openPriceAdjustModal,
    closePriceAdjustModal,
    isPriceAdjustOpen,

    // Delete Confirmation
    openDeleteConfirm,
    closeDeleteConfirm,
    isDeleteConfirmOpen,
    getProductToDelete,

    // Bulk Delete Confirmation
    openBulkDeleteConfirm,
    closeBulkDeleteConfirm,
    isBulkDeleteConfirmOpen,
    getBulkDeleteCount,

    // Utilities
    closeAllModals,
  };
};

export default useProductsModal;
