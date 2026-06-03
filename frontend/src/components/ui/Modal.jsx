/**
 * Generic Modal Component Wrapper
 *
 * Works with useModalStore to provide consistent modal behavior.
 *
 * Usage:
 * <Modal name="editProduct" title="Edit Product">
 *   <ProductForm />
 * </Modal>
 */

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import useModalStore from "../../stores/useModalStore";

const Modal = ({
  name,
  title,
  children,
  onClose,
  size = "md",
  closeButton = true,
  backdrop = true,
  className = "",
}) => {
  const isOpen = useModalStore((state) => state.isOpen(name));
  const closeModal = useModalStore((state) => state.closeModal);

  if (!isOpen) return null;

  const handleClose = () => {
    closeModal(name);
    onClose?.();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    full: "max-w-full mx-4",
  };

  return createPortal(
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 animation-fade-in pointer-events-auto"
          onClick={handleBackdropClick}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${className}`}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`${sizeClasses[size]} w-full max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl pointer-events-auto animation-slide-up`}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {closeButton && (
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 rounded-lg p-1"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animation-fade-in { animation: fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .animation-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animation-slide-up { animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </>,
    document.body,
  );
};

export default Modal;

/**
 * Confirmation Modal Component
 *
 * Usage:
 * <ConfirmModal
 *   name="deleteProductConfirm"
 *   title="Xóa sản phẩm?"
 *   message="Bạn chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
 *   onConfirm={() => deleteProduct()}
 * />
 */
export const ConfirmModal = ({
  name,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDangerous = false,
}) => {
  const closeModal = useModalStore((state) => state.closeModal);

  const handleConfirm = async () => {
    await onConfirm?.();
    closeModal(name);
  };

  const handleCancel = () => {
    onCancel?.();
    closeModal(name);
  };

  return (
    <Modal name={name} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Alert Modal Component
 *
 * Usage:
 * <AlertModal
 *   name="alertInfo"
 *   title="Thông báo"
 *   message="Thao tác thành công!"
 *   type="success"
 * />
 */
export const AlertModal = ({
  name,
  title,
  message,
  type = "info", // 'success', 'error', 'warning', 'info'
}) => {
  const closeModal = useModalStore((state) => state.closeModal);

  const typeStyles = {
    success: "text-green-600 bg-green-50 dark:bg-green-900/20",
    error: "text-red-600 bg-red-50 dark:bg-red-900/20",
    warning: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    info: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  };

  return (
    <Modal name={name} title={title} size="sm">
      <div className="space-y-4">
        <p className={`p-3 rounded-lg ${typeStyles[type]} text-sm`}>
          {message}
        </p>

        <div className="flex justify-end">
          <button
            onClick={() => closeModal(name)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
