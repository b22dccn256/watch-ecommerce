import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const InputModal = ({ config, onClose }) => {
  const [value, setValue] = useState(config ? config.defaultValue || "" : "");

  if (!config) return null;

  const { title = "Nhập giá trị", message = "Vui lòng nhập giá trị", label = "Giá trị", confirmLabel = "Xác nhận", onConfirm, loading = false } = config;

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm(value);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">{message}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-2 font-bold">{label}</label>
              <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition">Hủy</button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-luxury-gold text-luxury-dark hover:bg-yellow-500 transition">{confirmLabel}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InputModal;
