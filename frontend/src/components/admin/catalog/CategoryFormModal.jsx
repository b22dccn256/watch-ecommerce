import { motion } from "framer-motion";
import { PlusCircle, Pencil, Grid } from "lucide-react";

const CategoryFormModal = ({
  isOpen,
  onClose,
  catForm,
  setCatForm,
  processImage,
  submitCategory,
  updateCategory,
  loading,
  rootCategories,
  generateCategorySlug,
  editingId,
}) => {
  if (!isOpen) return null;

  const isEditing = !!editingId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-luxury-darker border rounded-xl shadow-2xl p-6 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-6 text-luxury-gold flex gap-2">
          {isEditing ? (
            <Pencil className="w-6 h-6" />
          ) : (
            <PlusCircle className="w-6 h-6" />
          )}
          {isEditing ? "Chỉnh Sửa Danh Mục" : "Tạo Danh Mục"}
        </h3>
        <form
          onSubmit={async (e) => {
            const ok = isEditing
              ? await updateCategory(editingId, e)
              : await submitCategory(e);
            if (ok) onClose();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Tên danh mục *
              </label>
              <input
                required
                type="text"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({
                    ...catForm,
                    name: e.target.value,
                    slug: generateCategorySlug(e.target.value),
                  })
                }
                className="w-full border rounded-lg px-4 py-2 text-sm"
                placeholder="VD: Dress Watches"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Slug URL
              </label>
              <input
                type="text"
                value={catForm.slug}
                onChange={(e) =>
                  setCatForm({ ...catForm, slug: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Danh mục cha
            </label>
            <select
              value={catForm.parentCategory}
              onChange={(e) =>
                setCatForm({ ...catForm, parentCategory: e.target.value })
              }
              className="w-full border rounded-lg px-4 py-2 text-sm"
            >
              <option value="">-- Không có (Danh mục gốc) --</option>
              {rootCategories.map((c) => (
                <option
                  key={c._id}
                  value={c._id}
                  disabled={editingId === c._id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Ảnh Icon
            </label>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 border rounded bg-gray-100 flex items-center justify-center">
                {catForm.image ? (
                  <img
                    src={catForm.image}
                    alt=""
                    className="w-full object-cover"
                  />
                ) : (
                  <Grid className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => processImage(e.target.files[0], setCatForm)}
                className="w-full border p-1 rounded text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-sm font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold"
            >
              {loading
                ? "Đang xử lý..."
                : isEditing
                  ? "Cập nhật"
                  : "Lưu danh mục"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CategoryFormModal;
