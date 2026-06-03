import { motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

const LogDetailModal = ({ showLogDetail, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-800 dark:border-luxury-border">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-2xl bg-white dark:bg-luxury-darker border shadow-sm ${showLogDetail.action.includes("DENIED") ? "border-red-100 dark:border-red-900/50 text-red-500" : "border-gray-100 dark:border-luxury-border text-[#b68a3c]"}`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                {showLogDetail.action}
              </h2>
              <p className="text-sm text-gray-500 dark:text-luxury-text-muted mt-1">
                {new Date(showLogDetail.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-luxury-text-muted dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
              Người thực hiện
            </p>
            <div className="flex items-center gap-4 bg-white dark:bg-luxury-dark border border-gray-800 dark:border-luxury-border p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-[#b68a3c]/20 flex items-center justify-center text-[#b68a3c] font-bold">
                {showLogDetail.userId?.name?.substring(0, 2).toUpperCase() ||
                  "AD"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                  {showLogDetail.userId?.email ||
                    showLogDetail.userId?.name ||
                    "Khách ẩn danh"}
                </p>
              </div>
              <span className="px-3 py-1 bg-[#b68a3c]/10 text-[#b68a3c] text-[10px] font-bold rounded-lg border border-[#b68a3c]/30 uppercase tracking-wider">
                {showLogDetail.userId?.role || "GUEST"}
              </span>
            </div>
          </div>

          {showLogDetail.changes && showLogDetail.changes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Chi tiết thay đổi
              </p>
              <div className="space-y-3">
                {showLogDetail.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-luxury-border"
                  >
                    <p className="font-bold text-[#b68a3c] mb-3 uppercase tracking-wider text-xs">
                      Trường: {change.field}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Cũ
                        </p>
                        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 p-3 rounded-lg border border-red-100 dark:border-red-400/20 text-xs break-all max-h-32 overflow-y-auto custom-scrollbar font-mono">
                          {typeof change.old === "object"
                            ? JSON.stringify(change.old, null, 2)
                            : String(change.old)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Mới
                        </p>
                        <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-400/20 text-xs break-all max-h-32 overflow-y-auto custom-scrollbar font-mono">
                          {typeof change.new === "object"
                            ? JSON.stringify(change.new, null, 2)
                            : String(change.new)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Địa chỉ IP
              </p>
              <div className="bg-[#cccccc] dark:bg-gray-800 p-3 rounded-xl h-11 flex items-center">
                <p className="text-sm font-bold text-white">
                  {showLogDetail.ip || "Unknown"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Model đích
              </p>
              <div className="bg-[#cccccc] dark:bg-gray-800 p-3 rounded-xl h-11 flex items-center">
                <p className="text-sm font-bold text-white uppercase truncate">
                  {showLogDetail.targetModel || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Trình duyệt / Thiết bị
            </p>
            <div className="bg-[#cccccc] dark:bg-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic break-words leading-relaxed">
                {showLogDetail.userAgent}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LogDetailModal;
