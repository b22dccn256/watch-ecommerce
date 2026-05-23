import useModalStore from '../stores/useModalStore';

const BRAND_MODAL = 'catalogBrand';
const CATEGORY_MODAL = 'catalogCategory';

export const useCatalogModals = () => {
  const openModal = useModalStore((s) => s.openModal);
  const closeModal = useModalStore((s) => s.closeModal);
  
  // Correctly subscribe to the specific modal states so components re-render on change
  const isBrandOpen = useModalStore((s) => s.isOpen(BRAND_MODAL));
  const isCategoryOpen = useModalStore((s) => s.isOpen(CATEGORY_MODAL));

  return {
    isBrandOpen,
    isCategoryOpen,
    openBrand: () => openModal(BRAND_MODAL),
    closeBrand: () => closeModal(BRAND_MODAL),
    openCategory: () => openModal(CATEGORY_MODAL),
    closeCategory: () => closeModal(CATEGORY_MODAL),
  };
};

export default useCatalogModals;
