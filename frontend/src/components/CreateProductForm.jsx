import { useEffect, useState, useRef } from "react";
import {
  PlusCircle,
  Loader,
  ImagePlus,
  Tag,
  DollarSign,
  X,
  Plus,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { MOVEMENT_FILTERS } from "../constants/watchFilters";
import { toast } from "react-hot-toast";

const machineTypes = MOVEMENT_FILTERS;

const inputCls =
  "w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/40 transition";
const labelCls =
  "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

const CreateProductForm = ({ onSuccess }) => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    image: "",
    stock: "",
    brand: "",
    type: "",
    wristSizeOptions: [],
    colors: "",
    sizes: "",
    specsStrapMaterial: "",
    specsCaseMaterial: "",
    specsCaseDiameter: "",
    specsWaterResistance: "",
  });

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const {
    createProduct,
    loading,
    brands,
    fetchBrands,
    categories,
    fetchCategories,
  } = useProductStore();

  useEffect(() => {
    if (brands.length === 0) fetchBrands();
    if (categories.length === 0) fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.image) {
      toast.error("Vui lòng tải lên ảnh đại diện của sản phẩm");
      return;
    }
    try {
      const finalStock =
        newProduct.wristSizeOptions.length > 0
          ? newProduct.wristSizeOptions.reduce(
              (acc, curr) => acc + (Number(curr.stock) || 0),
              0,
            )
          : Number(newProduct.stock);

      await createProduct({
        ...newProduct,
        stock: finalStock,
        price: Number(newProduct.price),
        originalPrice: newProduct.originalPrice
          ? Number(newProduct.originalPrice)
          : undefined,
        wristSizeOptions: newProduct.wristSizeOptions.filter(
          (o) => o.size.trim() !== "",
        ),
        colors: newProduct.colors
          ? newProduct.colors
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        sizes: newProduct.sizes
          ? newProduct.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        specs: {
          case: {
            material: newProduct.specsCaseMaterial || undefined,
            diameter: newProduct.specsCaseDiameter || undefined,
          },
          strap: { material: newProduct.specsStrapMaterial || undefined },
          waterResistance: newProduct.specsWaterResistance || undefined,
        },
      });
      setNewProduct({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        image: "",
        stock: "",
        brand: "",
        type: "",
        wristSizeOptions: [],
        colors: "",
        sizes: "",
        specsCaseMaterial: "",
        specsCaseDiameter: "",
        specsStrapMaterial: "",
        specsWaterResistance: "",
      });
      if (onSuccess) onSuccess();
    } catch {
      console.error("error creating a product");
    }
  };

  const addWristSizeOption = () => {
    setNewProduct((prev) => ({
      ...prev,
      wristSizeOptions: [...prev.wristSizeOptions, { size: "", stock: 0 }],
    }));
  };

  const updateWristOption = (index, field, value) => {
    setNewProduct((prev) => {
      const newOptions = prev.wristSizeOptions.map((opt, i) => {
        if (i === index) {
          return { ...opt, [field]: value };
        }
        return opt;
      });
      return { ...prev, wristSizeOptions: newOptions };
    });
  };

  const removeWristOption = (index) => {
    const newOptions = newProduct.wristSizeOptions.filter(
      (_, i) => i !== index,
    );
    setNewProduct((prev) => ({ ...prev, wristSizeOptions: newOptions }));
  };

  const processImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setNewProduct((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => processImageFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImageFile(e.dataTransfer.files[0]);
  };

  // Discount preview
  const discount =
    newProduct.originalPrice &&
    newProduct.price &&
    Number(newProduct.originalPrice) > 0
      ? Math.round(
          (1 - Number(newProduct.price) / Number(newProduct.originalPrice)) *
            100,
        )
      : null;

  const descLen = newProduct.description.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Column 1 ───────────────────────── */}
        <div className="space-y-4">
          {/* Tên sản phẩm */}
          <div>
            <label htmlFor="name" className={labelCls}>
              Tên Sản Phẩm *
            </label>
            <input
              type="text"
              id="name"
              required
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className={inputCls}
              placeholder="VD: Rolex Oyster Perpetual 41mm..."
            />
          </div>

          {/* Thương hiệu */}
          <div>
            <label htmlFor="brand" className={labelCls}>
              Thương hiệu *
            </label>
            <select
              id="brand"
              required
              value={newProduct.brand}
              onChange={(e) =>
                setNewProduct({ ...newProduct, brand: e.target.value })
              }
              className={inputCls}
            >
              {brands?.length === 0 ? (
                <option value="">Đang tải thương hiệu...</option>
              ) : (
                <>
                  <option value="">Chọn thương hiệu</option>
                  {brands?.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Price + Original Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className={labelCls}>
                Giá bán (₫) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luxury-gold" />
                <input
                  type="number"
                  id="price"
                  required
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className={inputCls + " pl-8"}
                />
              </div>
            </div>
            <div>
              <label htmlFor="originalPrice" className={labelCls}>
                Giá gốc (₫)
                {discount !== null && discount > 0 && (
                  <span className="ml-2 text-red-500 font-bold normal-case">
                    -{discount}%
                  </span>
                )}
              </label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="number"
                  id="originalPrice"
                  min="0"
                  value={newProduct.originalPrice}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      originalPrice: e.target.value,
                    })
                  }
                  className={inputCls + " pl-8"}
                  placeholder="Để trống nếu không giảm"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className={labelCls}>
              Tồn kho (Tổng) *
            </label>
            <input
              type="number"
              id="stock"
              required={newProduct.wristSizeOptions.length === 0}
              min="0"
              value={
                newProduct.wristSizeOptions.length > 0
                  ? newProduct.wristSizeOptions.reduce(
                      (acc, curr) => acc + (Number(curr.stock) || 0),
                      0,
                    )
                  : newProduct.stock
              }
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
              disabled={newProduct.wristSizeOptions.length > 0}
              className={
                inputCls +
                (newProduct.wristSizeOptions.length > 0
                  ? " bg-gray-200 cursor-not-allowed"
                  : "")
              }
              placeholder="VD: 50"
            />
            {newProduct.wristSizeOptions.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Tổng tồn kho tự động tính từ các size.
              </p>
            )}
          </div>
        </div>

        {/* ── Column 2 ───────────────────────── */}
        <div className="space-y-4">
          {/* Danh mục */}
          <div>
            <label htmlFor="category" className={labelCls}>
              Danh mục *
            </label>
            <select
              id="category"
              required
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              className={inputCls}
            >
              {categories?.length === 0 ? (
                <option value="">Đang tải danh mục...</option>
              ) : (
                <>
                  <option value="">Chọn danh mục</option>
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Bộ máy */}
          <div>
            <label htmlFor="type" className={labelCls}>
              Loại bộ máy (Movement) *
            </label>
            <select
              id="type"
              required
              value={newProduct.type}
              onChange={(e) =>
                setNewProduct({ ...newProduct, type: e.target.value })
              }
              className={inputCls}
            >
              <option value="">Chọn bộ máy</option>
              {machineTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Image drag-and-drop */}
          <div>
            <label className={labelCls}>Ảnh đại diện *</label>
            <div
              className={`drop-zone p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[120px] ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {newProduct.image ? (
                <div className="flex items-center gap-4 w-full">
                  <img
                    src={newProduct.image}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg border border-luxury-gold/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ảnh đã chọn
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Click để thay đổi
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Kéo thả ảnh vào đây hoặc{" "}
                    <span className="text-luxury-gold font-medium">
                      chọn file
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, WEBP – tối đa 5MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
      </div>

      {/* ── Kích cỡ cổ tay — Full width ── */}
      <div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls + " !mb-0"}>
            Kích cỡ cổ tay (Tùy chọn)
          </label>
          <button
            type="button"
            onClick={addWristSizeOption}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold hover:text-white font-bold rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm size
          </button>
        </div>
        {newProduct.wristSizeOptions.length > 0 ? (
          <div className="space-y-2">
            {/* Column labels */}
            <div className="flex items-center gap-3 px-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-1">
                Tên size
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-28 text-center">
                Số lượng
              </span>
              <span className="w-10" />
            </div>
            {newProduct.wristSizeOptions.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-luxury-darker/50 border border-gray-100 dark:border-luxury-border rounded-xl"
              >
                <input
                  type="text"
                  placeholder="VD: 38mm, S, M, 15cm..."
                  required
                  value={opt.size}
                  onChange={(e) => updateWristOption(i, "size", e.target.value)}
                  className={
                    inputCls.replace("w-full", "") +
                    " flex-1 bg-white dark:bg-luxury-dark"
                  }
                />
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  required
                  value={opt.stock}
                  onChange={(e) =>
                    updateWristOption(i, "stock", Number(e.target.value))
                  }
                  className={
                    inputCls.replace("w-full", "") +
                    " w-28 text-center bg-white dark:bg-luxury-dark"
                  }
                  title="Số lượng tồn kho"
                />
                <button
                  type="button"
                  onClick={() => removeWristOption(i)}
                  className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 bg-white dark:bg-luxury-dark hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-100 dark:border-luxury-border rounded-lg transition-colors shrink-0"
                  title="Xóa size này"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic py-1">
            Nhấn "+ Thêm size" để thêm phân loại kích cỡ cổ tay.
          </p>
        )}
      </div>

      {/* ── Thuộc tính sản phẩm ── */}
      <div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Thuộc tính sản phẩm
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Màu sắc</label>
            <input
              type="text"
              value={newProduct.colors}
              onChange={(e) =>
                setNewProduct({ ...newProduct, colors: e.target.value })
              }
              className={inputCls}
              placeholder="Đen, Bạc, Xanh dương..."
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Phân cách bằng dấu phẩy
            </p>
          </div>
          <div>
            <label className={labelCls}>Kích thước mặt</label>
            <input
              type="text"
              value={newProduct.sizes}
              onChange={(e) =>
                setNewProduct({ ...newProduct, sizes: e.target.value })
              }
              className={inputCls}
              placeholder="36mm, 40mm, 44mm"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Phân cách bằng dấu phẩy
            </p>
          </div>
          <div>
            <label className={labelCls}>Chất liệu dây</label>
            <select
              value={newProduct.specsStrapMaterial}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  specsStrapMaterial: e.target.value,
                })
              }
              className={inputCls}
            >
              <option value="">Chọn</option>
              <option>Da</option>
              <option>Thép không gỉ</option>
              <option>Cao su</option>
              <option>Vải NATO</option>
              <option>Ceramic</option>
              <option>Titanium</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Chất liệu vỏ</label>
            <select
              value={newProduct.specsCaseMaterial}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  specsCaseMaterial: e.target.value,
                })
              }
              className={inputCls}
            >
              <option value="">Chọn</option>
              <option>Thép không gỉ</option>
              <option>Titanium</option>
              <option>Vàng 18K</option>
              <option>Ceramic</option>
              <option>Nhựa</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Đường kính mặt</label>
            <input
              type="text"
              value={newProduct.specsCaseDiameter}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  specsCaseDiameter: e.target.value,
                })
              }
              className={inputCls}
              placeholder="40 mm"
            />
          </div>
          <div>
            <label className={labelCls}>Chống nước</label>
            <input
              type="text"
              value={newProduct.specsWaterResistance}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  specsWaterResistance: e.target.value,
                })
              }
              className={inputCls}
              placeholder="30m / 100m / 300m"
            />
          </div>
        </div>
      </div>

      {/* ── Description full width ───────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="description" className={labelCls + " mb-0"}>
            Mô tả sản phẩm *
          </label>
          <span
            className={`text-xs ${descLen >= 200 ? "text-green-500" : "text-gray-400"}`}
          >
            {descLen} / 200+ ký tự
          </span>
        </div>
        <textarea
          id="description"
          required
          rows="4"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
          className={inputCls + " resize-none"}
          placeholder="Chi tiết sản phẩm: chất liệu, tính năng, độ sâu chống nước..."
        />
        {descLen > 0 && descLen < 80 && (
          <p className="text-xs text-amber-500 mt-1">
            Nên thêm ít nhất 80 ký tự cho mô tả hấp dẫn hơn.
          </p>
        )}
      </div>

      {/* ── Submit ───────────────────────────── */}
      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-luxury-border">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" /> Hoàn tất tạo
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateProductForm;
