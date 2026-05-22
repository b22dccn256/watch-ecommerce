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
  const getModalData = useModalStore((state) => state.getModalData);
  const updateModalData = useModalStore((state) => state.updateModalData);

  // Correctly subscribe to each modal state to trigger re-renders on change
  const isCreateOpen = useModalStore((state) => state.isOpen('createProduct'));
  const isEditOpen = useModalStore((state) => state.isOpen('editProduct'));
  const isImportOpen = useModalStore((state) => state.isOpen('importProducts'));
  const isCampaignPickerOpen = useModalStore((state) => state.isOpen('campaignPicker'));
  const isPriceAdjustOpen = useModalStore((state) => state.isOpen('priceAdjust'));
  const isDeleteConfirmOpen = useModalStore((state) => state.isOpen('deleteConfirm'));
  const isBulkDeleteConfirmOpen = useModalStore((state) => state.isOpen('bulkDeleteConfirm'));

  // Create Product Modal
  const openCreateModal = () => openModal('createProduct');
  const closeCreateModal = () => closeModal('createProduct');

  // Edit Product Modal
  const openEditModal = (product) => openModal('editProduct', product);
  const closeEditModal = () => closeModal('editProduct');
  const getEditingProduct = () => getModalData('editProduct');
  const updateEditingProduct = (data) => updateModalData('editProduct', data);

  // Import Products Modal
  const openImportModal = () => openModal('importProducts');
  const closeImportModal = () => closeModal('importProducts');
  const getImportData = () => getModalData('importProducts');
  const setImportPreview = (preview) =>
    updateModalData('importProducts', { preview });
  const setImportFile = (file) => updateModalData('importProducts', { file });

  // Campaign Picker Modal (for bulk operations)
  const openCampaignPicker = () => openModal('campaignPicker');
  const closeCampaignPicker = () => closeModal('campaignPicker');

  // Price Adjust Modal (for bulk operations)
  const openPriceAdjustModal = () => openModal('priceAdjust');
  const closePriceAdjustModal = () => closeModal('priceAdjust');

  // Delete Confirmation Modal
  const openDeleteConfirm = (product) =>
    openModal('deleteConfirm', { product });
  const closeDeleteConfirm = () => closeModal('deleteConfirm');
  const getProductToDelete = () => getModalData('deleteConfirm')?.product;

  // Bulk Delete Confirmation Modal
  const openBulkDeleteConfirm = (count) =>
    openModal('bulkDeleteConfirm', { count });
  const closeBulkDeleteConfirm = () => closeModal('bulkDeleteConfirm');
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
