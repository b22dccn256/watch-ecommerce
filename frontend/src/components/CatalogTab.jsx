import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, PlusCircle, Trash2, Edit2, Check, X, ShieldCheck, MapPin, Grid, AlertTriangle, CornerDownRight, ImagePlus } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useProductStore } from "../stores/useProductStore";
import { confirmToast } from "../lib/confirmToast";

const CatalogTab = () => {
	const [activeSection, setActiveSection] = useState("brands"); 
	const { brands, fetchBrands, categories, fetchCategories, products, fetchAllProducts } = useProductStore();
	const [loading, setLoading] = useState(false);

	// Modals State
	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showCatModal, setShowCatModal] = useState(false);

	useEffect(() => {
		fetchBrands();
		fetchCategories();
		fetchAllProducts();
	}, [fetchBrands, fetchCategories, fetchAllProducts]);

	// BRAND LOGIC
	const [brandForm, setBrandForm] = useState({ name: "", description: "", isAuthorizedDealer: true, logo: "" });

	const processImage = (file, setFormState) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => setFormState(prev => ({ ...prev, image: reader.result, logo: reader.result }));
		reader.readAsDataURL(file);
	};

	const submitBrand = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post("/brands", brandForm);
			toast.success("Táº¡o thÆ°Æ¡ng hiá»‡u thĂ nh cĂ´ng!");
			setShowBrandModal(false);
			fetchBrands();
			setBrandForm({ name: "", description: "", isAuthorizedDealer: true, logo: "" });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lá»—i khi táº¡o thÆ°Æ¡ng hiá»‡u");
		} finally {
			setLoading(false);
		}
	};

	const deleteBrand = (brandId, brandName) => {
		const productsUsing = products.filter(p => typeof p.brand === 'object' ? p.brand?._id === brandId : p.brand === brandId);
		if (productsUsing.length > 0) {
			toast.error(`Cáº£nh bĂ¡o: CĂ³ ${productsUsing.length} sáº£n pháº©m Ä‘ang dĂ¹ng thÆ°Æ¡ng hiá»‡u nĂ y. KhĂ´ng thá»ƒ xĂ³a!`);
			return;
		}
		confirmToast(`Báº¡n cĂ³ cháº¯c muá»‘n xĂ³a thÆ°Æ¡ng hiá»‡u ${brandName}?`, async () => {
			setLoading(true);
			try {
				await axios.delete(`/brands/${brandId}`);
				toast.success("ÄĂ£ xĂ³a thÆ°Æ¡ng hiá»‡u");
				fetchBrands();
			} catch (error) {
				// Mocking frontend deletion if backend doesn't support
				toast.error("Endpoint DELETE /brands/:id cĂ³ thá»ƒ chÆ°a sáºµn sĂ ng.");
			} finally {
				setLoading(false);
			}
		});
	};

	// CATEGORY LOGIC
	const [catForm, setCatForm] = useState({ name: "", parentCategory: "", image: "", slug: "" });

	const generateSlug = (name) => {
		return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
	};

	const submitCategory = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post("/categories", {
				...catForm,
				parentCategory: catForm.parentCategory || null,
                slug: catForm.slug || generateSlug(catForm.name)
			});
			toast.success("Táº¡o danh má»¥c thĂ nh cĂ´ng!");
			setShowCatModal(false);
			fetchCategories();
			setCatForm({ name: "", parentCategory: "", image: "", slug: "" });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lá»—i khi táº¡o danh má»¥c");
		} finally {
			setLoading(false);
		}
	};

	const deleteCategory = (catId, catName) => {
		confirmToast(`XĂ³a danh má»¥c ${catName}?`, async () => {
			setLoading(true);
			try {
				await axios.delete(`/categories/${catId}`);
				toast.success("ÄĂ£ xĂ³a danh má»¥c");
				fetchCategories();
			} catch (error) {
				toast.error(error.response?.data?.message || "Lá»—i xĂ³a danh má»¥c");
			} finally {
				setLoading(false);
			}
		});
	};

	// Categorize the categories for Tree View simulation
	const categoryTree = useMemo(() => {
		const tree = [];
		const map = {};
		categories?.forEach(cat => map[cat._id] = { ...cat, children: [] });
		categories?.forEach(cat => {
			if (cat.parentCategory && map[cat.parentCategory]) {
				map[cat.parentCategory].children.push(map[cat._id]);
			} else {
				tree.push(map[cat._id]);
			}
		});
		return tree;
	}, [categories]);

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
						<Layers className="text-luxury-gold w-8 h-8" />
						Danh má»¥c & ThÆ°Æ¡ng hiá»‡u
					</h1>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm">
						Quáº£n lĂ½ Master Data cho kho hĂ ng: thÆ°Æ¡ng hiá»‡u Ä‘á»‘i tĂ¡c, cáº¥u trĂºc cĂ¢y danh má»¥c.
					</p>
				</div>
                <button 
					onClick={() => activeSection === "brands" ? setShowBrandModal(true) : setShowCatModal(true)}
					className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-white transition-all shadow-lg hover:-translate-y-0.5"
				>
					<PlusCircle className="w-4 h-4" /> THĂM {activeSection === "brands" ? "THÆ¯Æ NG HIá»†U" : "DANH Má»¤C"}
				</button>
			</div>

			<div className="flex gap-2 border-b border-gray-100 dark:border-luxury-border pb-px">
				<button onClick={() => setActiveSection("brands")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${activeSection === "brands" ? "border-luxury-gold text-luxury-gold" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}>
					ThÆ°Æ¡ng Hiá»‡u ({brands?.length || 0})
					{activeSection === "brands" && <motion.div layoutId="catLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />}
				</button>
				<button onClick={() => setActiveSection("categories")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${activeSection === "categories" ? "border-luxury-gold text-luxury-gold" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}>
					Cáº¥u TrĂºc Danh Má»¥c ({categories?.length || 0})
					{activeSection === "categories" && <motion.div layoutId="catLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />}
				</button>
			</div>

            {/* --- BRANDS VIEW --- */}
			{activeSection === "brands" && (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{brands?.length === 0 && <p className="text-gray-500 col-span-full">ChÆ°a cĂ³ thÆ°Æ¡ng hiá»‡u nĂ o.</p>}
					{brands?.map(brand => (
						<div key={brand._id} className="bg-white dark:bg-luxury-dark rounded-2xl border border-gray-100 dark:border-luxury-border overflow-hidden hover:shadow-xl transition flex flex-col group">
							<div className="h-32 bg-gray-50 dark:bg-black/20 flex items-center justify-center p-6 relative">
								{brand.logo ? (
                                    <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain filter dark:brightness-200" />
                                ) : (
                                    <div className="font-bold text-3xl font-mono text-gray-300 dark:text-gray-700">{brand.name.substring(0,2).toUpperCase()}</div>
                                )}
								<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
									<button onClick={() => deleteBrand(brand._id, brand.name)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
							<div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2 mt-auto">
								    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{brand.name}</h3>
                                    {brand.isAuthorizedDealer && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-1" title="Äáº¡i lĂ½ á»§y quyá»n" />}
                                </div>
								<p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">{brand.description || "ChÆ°a cĂ³ mĂ´ táº£"}</p>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold pt-3 border-t border-gray-100 dark:border-luxury-border flex justify-between items-center">
                                    <span>{new Date(brand.createdAt).toLocaleDateString("vi-VN")}</span>
                                </div>
							</div>
						</div>
					))}
				</motion.div>
			)}

            {/* --- CATEGORIES VIEW --- */}
			{activeSection === "categories" && (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-6">
                        {categoryTree.length === 0 && <p className="text-gray-500 text-center py-8">ChÆ°a cĂ³ danh má»¥c nĂ o.</p>}
                        
                        <div className="space-y-2">
                            {categoryTree.map(parentCat => (
                                <div key={parentCat._id} className="border border-gray-100 dark:border-luxury-border rounded-lg overflow-hidden bg-gray-50/50 dark:bg-gray-800/30">
                                    {/* Parent */}
                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-luxury-darker border-b border-gray-100 dark:border-luxury-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                {parentCat.image ? <img src={parentCat.image} className="w-6 h-6 object-cover" /> : <Grid className="w-5 h-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {parentCat.name}
                                                    {!parentCat.isActive && <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded">Táº¡m áº©n</span>}
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono">/{parentCat.slug}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => deleteCategory(parentCat._id, parentCat.name)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    {/* Children */}
                                    {parentCat.children && parentCat.children.length > 0 && (
                                        <div className="p-3 space-y-1">
                                            {parentCat.children.map(child => (
                                                <div key={child._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 transition ml-8">
                                                    <div className="flex items-center gap-3">
                                                        <CornerDownRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{child.name}</p>
                                                        <span className="text-xs text-gray-400 font-mono block sm:inline">/{child.slug}</span>
                                                    </div>
                                                    <button onClick={() => deleteCategory(child._id, child.name)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
				</motion.div>
			)}

            {/* ---> BRANDS MODAL <--- */}
			<AnimatePresence>
				{showBrandModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowBrandModal(false)}>
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<h3 className="text-xl font-bold mb-6 text-luxury-gold flex gap-2"><PlusCircle className="w-6 h-6" /> Táº¡o ThÆ°Æ¡ng Hiá»‡u</h3>
							<form onSubmit={submitBrand} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TĂªn thÆ°Æ¡ng hiá»‡u *</label>
                                    <input required type="text" value={brandForm.name} onChange={e => setBrandForm({...brandForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-luxury-dark border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 border text-sm" placeholder="VD: Rolex" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo / Biá»ƒu tÆ°á»£ng URL</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 border rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {brandForm.logo ? <img src={brandForm.logo} className="w-full object-contain" /> : <ImagePlus className="w-6 h-6 text-gray-400"/>}
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => processImage(e.target.files[0], setBrandForm)} className="w-full border p-1 rounded bg-white text-xs"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MĂ´ táº£ (TĂ¹y chá»n)</label>
                                    <textarea rows={3} value={brandForm.description} onChange={e => setBrandForm({...brandForm, description: e.target.value})} className="w-full bg-gray-50 dark:bg-luxury-dark border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 border text-sm" placeholder="Vá» lá»‹ch sá»­..." />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={brandForm.isAuthorizedDealer} onChange={e => setBrandForm({...brandForm, isAuthorizedDealer: e.target.checked})} className="accent-luxury-gold w-4 h-4" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Äáº¡i lĂ½ á»§y quyá»n chĂ­nh hĂ£ng (Authorized Dealer)</span>
                                </label>
								<div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-luxury-border">
									<button type="button" onClick={() => setShowBrandModal(false)} className="px-4 py-2 border rounded-lg text-sm font-bold">Há»§y</button>
									<button type="submit" disabled={loading} className="px-6 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold shadow-md hover:bg-yellow-500">{loading ? "Äang xá»­ lĂ½..." : "LÆ°u thÆ°Æ¡ng hiá»‡u"}</button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
            </AnimatePresence>

            {/* ---> CATEGORY MODAL <--- */}
			<AnimatePresence>
				{showCatModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatModal(false)}>
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<h3 className="text-xl font-bold mb-6 text-luxury-gold flex gap-2"><PlusCircle className="w-6 h-6" /> Táº¡o Danh Má»¥c</h3>
							<form onSubmit={submitCategory} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TĂªn danh má»¥c *</label>
                                        <input required type="text" value={catForm.name} onChange={e => {
                                            setCatForm({...catForm, name: e.target.value, slug: generateSlug(e.target.value) });
                                        }} className="w-full bg-gray-50 dark:bg-luxury-dark border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 border text-sm" placeholder="VD: Dress Watches" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug URL</label>
                                        <input type="text" value={catForm.slug} onChange={e => setCatForm({...catForm, slug: e.target.value})} className="w-full bg-gray-50 font-mono text-gray-500 dark:bg-luxury-dark border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 border text-sm" placeholder="tu-dong-tao" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Danh má»¥c cha</label>
                                    <select value={catForm.parentCategory} onChange={e => setCatForm({...catForm, parentCategory: e.target.value})} className="w-full bg-gray-50 dark:bg-luxury-dark border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 border text-sm">
                                        <option value="">-- KhĂ´ng cĂ³ (Danh má»¥c gá»‘c) --</option>
                                        {categories?.filter(c => !c.parentCategory).map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">áº¢nh Icon</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 border rounded bg-gray-100 flex items-center justify-center shrink-0">
                                            {catForm.image ? <img src={catForm.image} className="w-full object-cover" /> : <Grid className="w-5 h-5 text-gray-400"/>}
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => processImage(e.target.files[0], setCatForm)} className="w-full border p-1 rounded bg-white text-xs"/>
                                    </div>
                                </div>

								<div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-luxury-border">
									<button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 border rounded-lg text-sm font-bold">Há»§y</button>
									<button type="submit" disabled={loading} className="px-6 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold shadow-md hover:bg-yellow-500">{loading ? "Äang xá»­ lĂ½..." : "LÆ°u danh má»¥c"}</button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
            </AnimatePresence>
		</div>
	);
};

export default CatalogTab;

