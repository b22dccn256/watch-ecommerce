import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

/**
 * ConfirmModal — Production-grade confirmation dialog
 * 
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 * 
 *   setConfirm({
 *     title: "Xóa đơn hàng",
 *     message: "Thao tác này không thể hoàn tác.",
 *     variant: "danger" | "warning" | "info",
 *     confirmLabel: "Xóa",
 *     onConfirm: async () => { ... }
 *   });
 */
const ConfirmModal = ({ config, onClose }) => {
  if (!config) return null;

  const {
    title = "Xác nhận thao tác",
    message = "Bạn có chắc chắn muốn thực hiện thao tác này?",
    variant = "danger",
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    onConfirm,
    loading = false,
  } = config;

  const variantConfig = {
    danger: {
      icon: <Trash2 className="w-6 h-6" />,
      iconBg: "bg-red-500/10 text-red-400",
      confirmBtn: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
      borderAccent: "border-red-500/20",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: "bg-amber-400/10 text-amber-400",
      confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
      borderAccent: "border-amber-500/20",
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: "bg-blue-400/10 text-blue-400",
      confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20",
      borderAccent: "border-blue-500/20",
    },
  };

  const v = variantConfig[variant] || variantConfig.danger;

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: "spring", damping: 28, stiffness: 400 }}
          className={`w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 ${v.borderAccent} overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${v.iconBg}`}>
                {v.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2 ${v.confirmBtn}`}
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
