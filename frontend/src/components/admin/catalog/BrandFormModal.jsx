import { motion } from 'framer-motion';
import { PlusCircle, Pencil, ImagePlus } from 'lucide-react';

const BrandFormModal = ({ isOpen, onClose, brandForm, setBrandForm, processImage, submitBrand, updateBrand, loading, editingId }) => {
  if (!isOpen) return null;

  const isEditing = !!editingId;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl p-6 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-6 text-luxury-gold flex gap-2">
          {isEditing ? <Pencil className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
          {isEditing ? 'Chỉnh Sửa Thương Hiệu' : 'Tạo Thương Hiệu'}
        </h3>
        <form
          onSubmit={async (e) => {
            const ok = isEditing ? await updateBrand(editingId, e) : await submitBrand(e);
            if (ok) onClose();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên thương hiệu *</label>
            <input
              required
              type="text"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-lg px-4 py-2 border text-sm"
              placeholder="VD: Rolex"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo</label>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 border rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {brandForm.logo ? <img src={brandForm.logo} alt="" className="w-full object-contain" /> : <ImagePlus className="w-6 h-6 text-gray-400" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => processImage(e.target.files[0], setBrandForm)} className="w-full border p-1 rounded text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={brandForm.description}
              onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
              className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-lg px-4 py-2 border text-sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={brandForm.isAuthorizedDealer}
              onChange={(e) => setBrandForm({ ...brandForm, isAuthorizedDealer: e.target.checked })}
              className="accent-luxury-gold w-4 h-4"
            />
            <span className="text-sm font-bold">Đại lý ủy quyền chính hãng</span>
          </label>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-luxury-border">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-bold">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold">
              {loading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Lưu thương hiệu'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BrandFormModal;
