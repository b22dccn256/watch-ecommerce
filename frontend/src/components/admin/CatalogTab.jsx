import { motion, AnimatePresence } from 'framer-motion';
import { Layers, PlusCircle, Trash2, ShieldCheck, Grid, CornerDownRight } from 'lucide-react';
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
  const refreshCatalog = async () => {
    await Promise.all([fetchBrands(), fetchCategories()]);
  };

  const brand = useBrandManagement({ products, onRefresh: refreshCatalog });
  const category = useCategoryManagement({ categories, onRefresh: refreshCatalog });
  const modals = useCatalogModals();

  const openCreate = () => {
    if (activeSection === 'brands') modals.openBrand();
    else modals.openCategory();
  };

  return (
    <div className="space-y-8 min-h-[600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Layers className="text-luxury-gold w-8 h-8" />
            Danh mục & Thương hiệu
          </h1>
          <p className="text-gray-500 dark:text-luxury-text-muted text-sm">
            Quản lý Master Data: thương hiệu đối tác, cấu trúc cây danh mục.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold shadow-lg">
          <PlusCircle className="w-4 h-4" /> THÊM {activeSection === 'brands' ? 'THƯƠNG HIỆU' : 'DANH MỤC'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-100 dark:border-luxury-border pb-px">
        <button type="button" onClick={() => setActiveSection('brands')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeSection === 'brands' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-gray-500'}`}>
          Thương Hiệu ({brands.length})
        </button>
        <button type="button" onClick={() => setActiveSection('categories')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeSection === 'categories' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-gray-500'}`}>
          Cấu Trúc Danh Mục ({categories.length})
        </button>
      </div>

      {activeSection === 'brands' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.length === 0 && <p className="text-gray-500 col-span-full">Chưa có thương hiệu nào.</p>}
          {brands.map((b) => (
            <div key={b._id} className="bg-white dark:bg-luxury-dark rounded-2xl border overflow-hidden group">
              <div className="h-32 bg-gray-50 dark:bg-black/20 flex items-center justify-center p-6 relative">
                {b.logo ? <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" /> : <span className="font-bold text-3xl text-gray-300">{b.name.substring(0, 2).toUpperCase()}</span>}
                <button type="button" onClick={() => brand.deleteBrand(b._id, b.name)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-50 text-red-500 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {b.name}
                  {b.isAuthorizedDealer && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-2">{b.description || 'Chưa có mô tả'}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeSection === 'categories' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-luxury-dark border rounded-xl p-6">
          {categoryTree.length === 0 && <p className="text-gray-500 text-center py-8">Chưa có danh mục nào.</p>}
          <div className="space-y-2">
            {categoryTree.map((parentCat) => (
              <div key={parentCat._id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-luxury-darker border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {parentCat.image ? <img src={parentCat.image} alt="" className="w-6 h-6 object-cover" /> : <Grid className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-bold">{parentCat.name}</p>
                      <p className="text-xs text-gray-400 font-mono">/{parentCat.slug}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => category.deleteCategory(parentCat._id, parentCat.name)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {parentCat.children?.length > 0 && (
                  <div className="p-3 space-y-1">
                    {parentCat.children.map((child) => (
                      <div key={child._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 ml-8">
                        <div className="flex items-center gap-3">
                          <CornerDownRight className="w-4 h-4 text-gray-300" />
                          <p className="font-semibold text-sm">{child.name}</p>
                          <span className="text-xs text-gray-400 font-mono">/{child.slug}</span>
                        </div>
                        <button type="button" onClick={() => category.deleteCategory(child._id, child.name)} className="p-1.5 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <BrandFormModal
          isOpen={modals.isBrandOpen}
          onClose={modals.closeBrand}
          brandForm={brand.brandForm}
          setBrandForm={brand.setBrandForm}
          processImage={brand.processImage}
          submitBrand={brand.submitBrand}
          loading={brand.loading}
        />
        <CategoryFormModal
          isOpen={modals.isCategoryOpen}
          onClose={modals.closeCategory}
          catForm={category.catForm}
          setCatForm={category.setCatForm}
          processImage={category.processImage}
          submitCategory={category.submitCategory}
          loading={category.loading}
          rootCategories={category.rootCategories}
          generateCategorySlug={category.generateCategorySlug}
        />
      </AnimatePresence>
    </div>
  );
};

export default CatalogTab;
