import useModalStore from '../stores/useModalStore';

const MODAL_CREATE = 'createCoupon';

export const useCouponsModal = () => {
  const openModal = useModalStore((s) => s.openModal);
  const closeModal = useModalStore((s) => s.closeModal);
  const isOpen = useModalStore((s) => s.isOpen);

  return {
    isCreateOpen: isOpen(MODAL_CREATE),
    openCreate: () => openModal(MODAL_CREATE),
    closeCreate: () => closeModal(MODAL_CREATE),
  };
};

export default useCouponsModal;
