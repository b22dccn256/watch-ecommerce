import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, PlusCircle, Trash2, ShieldCheck, Grid, CornerDownRight, Pencil } from 'lucide-react';
import { useProductStore } from '../../stores/useProductStore';
import useCatalogData from '../../hooks/useCatalogData';
import useBrandManagement from '../../hooks/useBrandManagement';
import useCategoryManagement from '../../hooks/useCategoryManagement';
import useCatalogModals from '../../hooks/useCatalogModals';
import BrandFormModal from './catalog/BrandFormModal';
import CategoryFormModal from './catalog/CategoryFormModal';

const CatalogTab = () => {
  const { fetchBrands, fetchCategories } = useProductStore();
  const { activeSection, setActiveSection, brands, categories, products, categoryTree } = useCatalogData();
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const refreshCatalog = async () => {
    await Promise.all([fetchBrands(true), fetchCategories(true)]);
  };

  const brand = useBrandManagement({ products, onRefresh: refreshCatalog });
  const category = useCategoryManagement({ categories, onRefresh: refreshCatalog });
  const modals = useCatalogModals();

  const openCreate = () => {
    if (activeSection === 'brands') {
      setEditingBrandId(null);
      brand.resetBrandForm();
      modals.openBrand();
    } else {
      setEditingCategoryId(null);
      category.resetCatForm();
      modals.openCategory();
    }
  };

  const openEditBrand = (b) => {
    brand.startEditBrand(b);
    setEditingBrandId(b._id);
    modals.openBrand();
  };

  const openEditCategory = (cat) => {
    category.startEditCategory(cat);
    setEditingCategoryId(cat._id);
    modals.openCategory();
  };

  return (
    <div className="space-y-8 min-h-[600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-3">
            <Layers className="w-6 h-6 text-[color:var(--color-gold)]" />
            Danh mục & Thương hiệu
          </h2>
          <p className="text-sm text-secondary">
            Quản lý Master Data: thương hiệu đối tác, cấu trúc cây danh mục.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[color:var(--color-gold)] text-[color:var(--color-gold)] text-sm font-semibold transition hover:bg-[color:var(--color-gold)] hover:text-white"
        >
          <PlusCircle className="w-4 h-4" />
          THÊM {activeSection === 'brands' ? 'THƯƠNG HIỆU' : 'DANH MỤC'}
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-black/8 dark:border-white/8 pb-px">
        <button
          type="button"
          onClick={() => setActiveSection('brands')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeSection === 'brands'
              ? 'border-[color:var(--color-gold)] text-[color:var(--color-gold)]'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Thương Hiệu ({brands.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('categories')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeSection === 'categories'
              ? 'border-[color:var(--color-gold)] text-[color:var(--color-gold)]'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Cấu Trúc Danh Mục ({categories.length})
        </button>
      </div>

      {/* Brands Grid */}
      {activeSection === 'brands' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {brands.length === 0 && (
            <p className="text-secondary col-span-full text-sm text-center py-12">Chưa có thương hiệu nào.</p>
          )}
          {brands.map((b) => (
            <div
              key={b._id}
              className="rounded-2xl border border-black/8 dark:border-white/8 bg-surface overflow-hidden group transition hover:border-[color:var(--color-gold)]/30"
            >
              <div className="h-32 bg-[color:var(--color-surface-2)] flex items-center justify-center p-6 relative">
                {b.logo
                  ? <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" />
                  : <span className="font-bold text-3xl text-muted">{b.name.substring(0, 2).toUpperCase()}</span>
                }
                <button
                  type="button"
                  onClick={() => openEditBrand(b)}
                  className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 p-1.5 bg-blue-500/10 text-blue-500 rounded-lg transition"
                  title="Sửa thương hiệu"
                >
                  <Pencil className="w-4 h-4 pointer-events-none" />
                </button>
                <button
                  type="button"
                  onClick={() => brand.deleteBrand(b._id, b.name)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  {b.name}
                  {b.isAuthorizedDealer && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
                <p className="text-xs text-secondary line-clamp-2 mt-1">{b.description || 'Chưa có mô tả'}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Categories Tree */}
      {activeSection === 'categories' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-black/8 dark:border-white/8 bg-surface p-5"
        >
          {categoryTree.length === 0 && (
            <p className="text-secondary text-center py-10 text-sm">Chưa có danh mục nào.</p>
          )}
          <div className="space-y-2">
            {categoryTree.map((parentCat) => (
              <div key={parentCat._id} className="rounded-xl border border-black/8 dark:border-white/8 overflow-hidden">
                {/* Parent row */}
                <div className="flex items-center justify-between px-4 py-3 bg-[color:var(--color-surface-2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-black/8 dark:border-white/8 flex items-center justify-center">
                      {parentCat.image
                        ? <img src={parentCat.image} alt="" className="w-5 h-5 object-cover rounded" />
                        : <Grid className="w-4 h-4 text-muted" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-primary">{parentCat.name}</p>
                      <p className="text-[10px] text-muted font-mono">/{parentCat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCategory(parentCat)}
                      className="p-1.5 text-muted transition hover:text-blue-500 rounded-lg hover:bg-blue-500/8"
                      title="Sửa danh mục"
                    >
                      <Pencil className="w-4 h-4 pointer-events-none" />
                    </button>
                    <button
                      type="button"
                      onClick={() => category.deleteCategory(parentCat._id, parentCat.name)}
                      className="p-1.5 text-muted transition hover:text-red-500 rounded-lg hover:bg-red-500/8"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                {parentCat.children?.length > 0 && (
                  <div className="p-2 space-y-1">
                    {parentCat.children.map((child) => (
                      <div
                        key={child._id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[color:var(--color-surface-2)] ml-8 transition"
                      >
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-muted" />
                          <p className="text-sm font-medium text-primary">{child.name}</p>
                          <span className="text-[10px] text-muted font-mono">/{child.slug}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCategory(child)}
                            className="p-1 text-muted transition hover:text-blue-500"
                            title="Sửa danh mục con"
                          >
                            <Pencil className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={() => category.deleteCategory(child._id, child.name)}
                            className="p-1 text-muted transition hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {modals.isBrandOpen && (
          <BrandFormModal
            key="brand-modal"
            isOpen={modals.isBrandOpen}
            onClose={() => { modals.closeBrand(); setEditingBrandId(null); }}
            brandForm={brand.brandForm}
            setBrandForm={brand.setBrandForm}
            processImage={brand.processImage}
            submitBrand={brand.submitBrand}
            updateBrand={brand.updateBrand}
            loading={brand.loading}
            editingId={editingBrandId}
          />
        )}
        {modals.isCategoryOpen && (
          <CategoryFormModal
            key="category-modal"
            isOpen={modals.isCategoryOpen}
            onClose={() => { modals.closeCategory(); setEditingCategoryId(null); }}
            catForm={category.catForm}
            setCatForm={category.setCatForm}
            processImage={category.processImage}
            submitCategory={category.submitCategory}
            updateCategory={category.updateCategory}
            loading={category.loading}
            rootCategories={category.rootCategories}
            generateCategorySlug={category.generateCategorySlug}
            editingId={editingCategoryId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatalogTab;
