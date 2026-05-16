import useModalStore from '../stores/useModalStore';

const BRAND_MODAL = 'catalogBrand';
const CATEGORY_MODAL = 'catalogCategory';

export const useCatalogModals = () => {
  const openModal = useModalStore((s) => s.openModal);
  const closeModal = useModalStore((s) => s.closeModal);
  const isOpen = useModalStore((s) => s.isOpen);

  return {
    isBrandOpen: isOpen(BRAND_MODAL),
    isCategoryOpen: isOpen(CATEGORY_MODAL),
    openBrand: () => openModal(BRAND_MODAL),
    closeBrand: () => closeModal(BRAND_MODAL),
    openCategory: () => openModal(CATEGORY_MODAL),
    closeCategory: () => closeModal(CATEGORY_MODAL),
  };
};

export default useCatalogModals;
