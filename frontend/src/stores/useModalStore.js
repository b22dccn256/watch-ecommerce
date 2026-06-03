/**
 * Modal Store - Zustand
 *
 * Centralized modal state management for the entire application.
 * Replace scattered modal boolean states with a single source of truth.
 *
 * Usage:
 * const { openModal, closeModal, isOpen } = useModalStore();
 *
 * // Open a modal
 * openModal('editProduct', { productId: 123 });
 *
 * // Check if open
 * const isEditOpen = useModalStore(s => s.isOpen('editProduct'));
 *
 * // Get modal data
 * const data = useModalStore(s => s.getModalData('editProduct'));
 *
 * // Close modal
 * closeModal('editProduct');
 */

import { create } from "zustand";

const useModalStore = create((set, get) => ({
  // Store for modal states: { modalName: { open, data } }
  modals: {},

  /**
   * Open a modal with optional data
   * @param {string} name - Modal identifier (e.g., 'editProduct', 'deleteConfirm')
   * @param {Object} data - Optional data to pass to the modal
   */
  openModal: (name, data = null) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: { open: true, data },
      },
    }));
  },

  /**
   * Close a modal
   * @param {string} name - Modal identifier
   */
  closeModal: (name) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: { open: false, data: null },
      },
    }));
  },

  /**
   * Toggle modal state
   * @param {string} name - Modal identifier
   * @param {Object} data - Optional data to pass (if opening)
   */
  toggleModal: (name, data = null) => {
    const state = get();
    const isCurrentlyOpen = state.isOpen(name);

    if (isCurrentlyOpen) {
      state.closeModal(name);
    } else {
      state.openModal(name, data);
    }
  },

  /**
   * Check if a modal is open
   * @param {string} name - Modal identifier
   * @returns {boolean}
   */
  isOpen: (name) => {
    const state = get();
    return state.modals[name]?.open ?? false;
  },

  /**
   * Get modal data
   * @param {string} name - Modal identifier
   * @returns {Object|null}
   */
  getModalData: (name) => {
    const state = get();
    return state.modals[name]?.data ?? null;
  },

  /**
   * Update modal data without changing open state
   * @param {string} name - Modal identifier
   * @param {Object} data - New data to merge
   */
  updateModalData: (name, data) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: {
          ...state.modals[name],
          data: { ...state.modals[name]?.data, ...data },
        },
      },
    }));
  },

  /**
   * Close all modals
   */
  closeAll: () => {
    set((state) => {
      const newModals = {};
      Object.keys(state.modals).forEach((key) => {
        newModals[key] = { open: false, data: null };
      });
      return { modals: newModals };
    });
  },

  /**
   * Get all open modals
   * @returns {Array<string>} - Array of open modal names
   */
  getOpenModals: () => {
    const state = get();
    return Object.entries(state.modals)
      .filter(([, { open }]) => open)
      .map(([name]) => name);
  },

  /**
   * Get modal state object
   * @param {string} name - Modal identifier
   * @returns {Object}
   */
  getModal: (name) => {
    const state = get();
    return state.modals[name] || { open: false, data: null };
  },
}));

export default useModalStore;

/**
 * Available Modal Names (for consistency)
 *
 * Product Management:
 * - 'editProduct'
 * - 'deleteProductConfirm'
 * - 'importProducts'
 * - 'exportProducts'
 *
 * User Management:
 * - 'editUser'
 * - 'deleteUserConfirm'
 * - 'viewUserDetails'
 *
 * Order Management:
 * - 'editOrder'
 * - 'orderDetails'
 * - 'cancelOrderConfirm'
 *
 * Checkout:
 * - 'confirmCheckout'
 * - 'paymentQR'
 *
 * General:
 * - 'deleteConfirm'
 * - 'alertInfo'
 * - 'customDialog'
 */
