import useModalStore from '../stores/useModalStore';

const MODAL_CREATE = 'createCoupon';

export const useCouponsModal = () => {
  const openModal = useModalStore((s) => s.openModal);
  const closeModal = useModalStore((s) => s.closeModal);
  
  // Correctly subscribe to the specific modal state so components re-render on change
  const isCreateOpen = useModalStore((s) => s.isOpen(MODAL_CREATE));

  return {
    isCreateOpen,
    openCreate: () => openModal(MODAL_CREATE),
    closeCreate: () => closeModal(MODAL_CREATE),
  };
};

export default useCouponsModal;
