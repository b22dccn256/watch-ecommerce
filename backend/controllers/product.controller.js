import Product from '../models/product.model.js';
import ProductAudit from '../models/productAudit.model.js';
import Category from '../models/category.model.js';
import CampaignService from '../services/campaign.service.js';
import ProductService, {
  buildProductQuery,
  applyProductSort,
  handleProductImage,
  updateFeaturedProductsCache,
  processImportRow,
  buildImportPreview,
  buildExportXLSX,
} from '../services/product.service.js';
import mongoose from 'mongoose';
import fs from 'fs';
import XLSX from 'xlsx';

// ────────────────────────────────────────────────────────────────
// READ OPERATIONS
// ────────────────────────────────────────────────────────────────

export const getAllProducts = async (req, res) => {
  try {
    console.time('[timing] getAllProducts');
    const { page, limit, sort, ...filters } = req.query;
    const query = await buildProductQuery(filters);
    let productsQuery = Product.find(query).populate('brand', 'name').populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } });
    productsQuery = applyProductSort(productsQuery, sort);

    if (page && limit) {
      const pageNum  = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const [products, total] = await Promise.all([
        productsQuery.skip((pageNum - 1) * limitNum).limit(limitNum),
        Product.countDocuments(query),
      ]);
      const processed = await CampaignService.applyCampaignToProducts(products);
      console.timeEnd('[timing] getAllProducts');
      return res.json({ products: processed, totalPages: Math.ceil(total / limitNum), currentPage: pageNum, total, totalCount: total });
    }

    const products  = await productsQuery;
    const processed = await CampaignService.applyCampaignToProducts(products);
    console.timeEnd('[timing] getAllProducts');
    return res.json({ products: processed });
  } catch (error) {
    console.error('[ProductCtrl] getAllProducts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { redis } = await import('../lib/redis.js');
    const Brand = (await import('../models/brand.model.js')).default;

    const brandDocs = await Brand.find({ name: { $regex: q, $options: 'i' } });
    const brandIds  = brandDocs.map(b => b._id);

    const suggestions = await Product.find({
      deletedAt: null,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $in: brandIds } },
        { type: { $regex: q, $options: 'i' } },
      ],
    }).populate('brand', 'name').select('name image price brand').limit(5);

    res.json(suggestions);
  } catch (error) {
    console.error('[ProductCtrl] getSuggestions:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null })
      .populate('brand', 'name')
      .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const processed = await CampaignService.applyCampaignToProducts(product);
    res.json(processed);
  } catch (error) {
    console.error('[ProductCtrl] getProductById:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProductBySlugToken = async (req, res) => {
  try {
    const { slug, token } = req.params;
    if (!slug || !token) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const tokenQuery = mongoose.Types.ObjectId.isValid(token)
      ? { $or: [{ slugToken: token }, { _id: token }] }
      : { slugToken: token };

    const product = await Product.findOne({ ...tokenQuery, deletedAt: null })
      .populate('brand', 'name')
      .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const canonicalSlug = product.slug || slug;
    const canonicalToken = product.slugToken || product._id.toString();
    if (slug !== canonicalSlug || token !== canonicalToken) {
      return res.redirect(301, `/api/products/${canonicalSlug}--${canonicalToken}`);
    }

    const processed = await CampaignService.applyCampaignToProducts(product);
    res.json(processed);
  } catch (error) {
    console.error('[ProductCtrl] getProductBySlugToken:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await Product.find({ isFeatured: true, deletedAt: null })
      .populate('brand', 'name')
      .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } })
      .lean();

    if (!featuredProducts || featuredProducts.length === 0) {
      featuredProducts = await Product.find({ deletedAt: null })
        .populate('brand', 'name')
        .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } })
        .limit(8)
        .lean();
    }

    // Update Redis cache (fire-and-forget with error logging)
    updateFeaturedProductsCache().catch(err =>
      console.error('[ProductCtrl] Featured cache update failed:', err.message)
    );

    const processed = await CampaignService.applyCampaignToProducts(featuredProducts);
    res.json(processed);
  } catch (error) {
    console.error('[ProductCtrl] getFeaturedProducts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null, isActive: true })
      .populate('brand', 'name logo')
      .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(4)
      .lean();
    const processed = await CampaignService.applyCampaignToProducts(products);
    res.json(processed);
  } catch (error) {
    console.error('[ProductCtrl] getRecommendedProducts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const query = await buildProductQuery({ category });
    const products = await Product.find(query).populate('brand', 'name').populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } });
    const processed = await CampaignService.applyCampaignToProducts(products);
    res.json({ products: processed });
  } catch (error) {
    console.error('[ProductCtrl] getProductsByCategory:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getInventoryAlerts = async (req, res) => {
  try {
    const page            = parseInt(req.query.page)      || 1;
    const limit           = parseInt(req.query.limit)     || 10;
    const customThreshold = req.query.threshold ? parseInt(req.query.threshold) : null;

    const matchQuery = { deletedAt: null };
    if (customThreshold !== null) {
      matchQuery.stock = { $lte: customThreshold };
    } else {
      matchQuery.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(matchQuery),
      Product.find(matchQuery)
        .select('name image stock lowStockThreshold price categoryId')
        .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } })
        .sort({ stock: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ products, totalPages: Math.ceil(total / limit), currentPage: page, totalAlerts: total });
  } catch (error) {
    console.error('[ProductCtrl] getInventoryAlerts:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────
// WRITE OPERATIONS
// ────────────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, image, images, category, categoryId,
      stock, brand, type, customAttributes, lowStockThreshold, isActive,
      metaTitle, metaDescription, colors, sizes, specs, wristSizeOptions,
      collectionName, gender, tags, sku, videoUrl, video360Url, costPrice,
    } = req.body;

    // Support multiple images
    let imageUrl = '';
    let imagesUrls = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const url = await handleProductImage(img);
        if (url) imagesUrls.push(url);
      }
      imageUrl = imagesUrls[0] || '';
    } else if (image) {
      imageUrl = await handleProductImage(image);
      if (imageUrl) imagesUrls = [imageUrl];
    }

    // category can be string (category name) or ObjectId
    let resolvedCategoryId = category || categoryId || null;

    const product = new Product({
      name, description, price,
      originalPrice: originalPrice || null,
      costPrice: costPrice || Math.round((price || 0) * 0.7),
      image: imageUrl,
      images: imagesUrls,
      categoryId: resolvedCategoryId,
      stock, brand, type,
      customAttributes: customAttributes || [],
      colors: colors || [],
      sizes: sizes || [],
      specs: specs || undefined,
      wristSizeOptions: wristSizeOptions || [],
      lowStockThreshold, isActive, metaTitle, metaDescription,
      collectionName: collectionName || '',
      gender: gender || 'unisex',
      tags: tags || [],
      sku: sku || '',
      videoUrl: videoUrl || null,
      video360Url: video360Url || null,
    });
    product.$locals = { userId: req.user._id };
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error('[ProductCtrl] createProduct:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const {
      name, description, price, originalPrice, image, images, category, categoryId,
      stock, brand, type, customAttributes, lowStockThreshold, isActive,
      metaTitle, metaDescription, colors, sizes, specs, wristSizeOptions,
      collectionName, gender, tags, sku, videoUrl, video360Url, costPrice,
    } = req.body;

    if (name !== undefined)                         product.name              = name;
    if (description !== undefined)                  product.description       = description;
    if (price !== undefined)                        product.price             = price;
    if (originalPrice !== undefined)                product.originalPrice     = originalPrice || null;
    if (costPrice !== undefined)                    product.costPrice         = costPrice;
    if (category !== undefined || categoryId !== undefined) product.categoryId = category || categoryId;
    if (stock !== undefined)                        product.stock             = stock;
    if (brand !== undefined && brand !== '')        product.brand             = brand;
    if (type !== undefined)                         product.type              = type;
    if (customAttributes !== undefined)             product.customAttributes  = customAttributes;
    if (colors !== undefined)                       product.colors            = colors;
    if (sizes !== undefined)                        product.sizes             = sizes;
    if (specs !== undefined)                        product.specs             = { ...product.specs?.toObject?.() || product.specs, ...specs };
    if (wristSizeOptions !== undefined)             product.wristSizeOptions  = wristSizeOptions;
    if (lowStockThreshold !== undefined)            product.lowStockThreshold = lowStockThreshold;
    if (isActive !== undefined)                     product.isActive          = isActive;
    if (metaTitle !== undefined)                    product.metaTitle         = metaTitle;
    if (metaDescription !== undefined)              product.metaDescription   = metaDescription;
    if (collectionName !== undefined)               product.collectionName    = collectionName;
    if (gender !== undefined)                       product.gender            = gender;
    if (tags !== undefined)                         product.tags              = tags;
    if (sku !== undefined)                          product.sku               = sku;
    if (videoUrl !== undefined)                     product.videoUrl          = videoUrl;
    if (video360Url !== undefined)                  product.video360Url       = video360Url;

    // Smart image handling: support `images` array. Upload new images and replace product.images.
    if (Array.isArray(images) && images.length > 0) {
      const newUrls = [];
      for (const img of images) {
        const url = await handleProductImage(img);
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) {
        product.images = newUrls;
        product.image = newUrls[0];
      }
    } else if (image && image !== product.image) {
      product.image = await handleProductImage(image, product.image);
      if (product.image && (!product.images || product.images.length === 0)) product.images = [product.image];
    }

    product.$locals = { userId: req.user._id };
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error('[ProductCtrl] updateProduct:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });
    if (!product) return res.status(404).json({ message: 'Product not found or already deleted' });

    await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedAt: new Date(), isActive: false } },
      { runValidators: false }
    );
    res.json({ message: 'Product deleted successfully (Soft Delete)' });
  } catch (error) {
    console.error('[ProductCtrl] deleteProduct:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isFeatured: !product.isFeatured } },
      { new: true, runValidators: false }
    );
    await updateFeaturedProductsCache();
    res.json(updated);
  } catch (error) {
    console.error('[ProductCtrl] toggleFeaturedProduct:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const bulkUpdateProducts = async (req, res) => {
  try {
    const { action, ids, value } = req.body;
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'action và ids[] là bắt buộc' });
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) return res.status(400).json({ message: 'Không có ID hợp lệ' });

    if (action === 'adjustPrice') {
      const pct = Number(value);
      if (isNaN(pct)) return res.status(400).json({ message: 'value phải là số %' });
      const products = await Product.find({ _id: { $in: validIds }, deletedAt: null });
      
      const bulkOps = [];
      const auditLogs = [];
      
      for (const p of products) {
        let newPrice = Math.max(0, Math.round(p.price * (1 + pct / 100)));
        // Enforce Phase 5 price protections
        if (p.originalPrice !== null && p.originalPrice !== undefined && newPrice > p.originalPrice) {
          newPrice = p.originalPrice;
        }
        if (p.costPrice !== null && p.costPrice !== undefined && newPrice < p.costPrice) {
          newPrice = p.costPrice;
        }
        
        if (newPrice !== p.price) {
          bulkOps.push({
            updateOne: {
              filter: { _id: p._id },
              update: { $set: { price: newPrice } }
            }
          });
          
          auditLogs.push({
            productId: p._id,
            userId: req.user?._id || null,
            action: 'Updated',
            changes: { price: newPrice }
          });
        }
      }
      
      let modifiedCount = 0;
      if (bulkOps.length > 0) {
        const result = await Product.bulkWrite(bulkOps, { runValidators: false });
        modifiedCount = result.modifiedCount;
        await ProductAudit.insertMany(auditLogs);
      }
      
      return res.json({ message: `Đã điều chỉnh giá ${pct > 0 ? '+' : ''}${pct}% cho ${modifiedCount} sản phẩm` });
    }

    if (action === 'toggleFeatured') {
      const products = await Product.find({ _id: { $in: validIds }, deletedAt: null });
      const bulkOps  = products.map(p => ({
        updateOne: { filter: { _id: p._id }, update: { $set: { isFeatured: !p.isFeatured } } }
      }));
      const result = await Product.bulkWrite(bulkOps, { runValidators: false });
      
      const auditLogs = products.map(p => ({
        productId: p._id,
        userId: req.user?._id || null,
        action: 'Updated',
        changes: { isFeatured: !p.isFeatured }
      }));
      if (auditLogs.length > 0) {
        await ProductAudit.insertMany(auditLogs);
      }
      
      await updateFeaturedProductsCache();
      return res.json({ message: `Đã toggle nổi bật cho ${result.modifiedCount} sản phẩm` });
    }

    if (action === 'softDelete') {
      const products = await Product.find({ _id: { $in: validIds }, deletedAt: null });
      const now = new Date();
      const result = await Product.updateMany(
        { _id: { $in: validIds }, deletedAt: null },
        { $set: { deletedAt: now, isActive: false } },
        { runValidators: false }
      );
      
      const auditLogs = products.map(p => ({
        productId: p._id,
        userId: req.user?._id || null,
        action: 'Deleted',
        changes: { deletedAt: now, isActive: false }
      }));
      if (auditLogs.length > 0) {
        await ProductAudit.insertMany(auditLogs);
      }
      
      return res.json({ message: `Đã xóa ${result.modifiedCount} sản phẩm` });
    }

    return res.status(400).json({ message: `Action '${action}' không hợp lệ` });
  } catch (error) {
    console.error('[ProductCtrl] bulkUpdateProducts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────
// IMPORT / EXPORT
// ────────────────────────────────────────────────────────────────

export const previewImportProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file được gửi lên' });
    const workbook = XLSX.readFile(req.file.path);
    const data     = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({
      total:   data.length,
      preview: buildImportPreview(data),
      message: `Đọc thành công ${data.length} sản phẩm. Kiểm tra và xác nhận để import.`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during preview', error: error.message });
  }
};

export const importProducts = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionActive = false;
  try {
    session.startTransaction();
    transactionActive = true;
  } catch (err) {
    console.log("ℹ️ Transactions not supported on this MongoDB setup. Importing without transaction safety.");
  }

  try {
    if (!req.file) {
      if (transactionActive) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Không có file được gửi lên' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const data     = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    // Fail-fast validation: check for missing names
    const invalidRows = data.filter(row => !row.name && !row['Tên sản phẩm']);
    if (invalidRows.length > 0) {
      if (transactionActive) await session.abortTransaction();
      session.endSession();
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({
        message: `${invalidRows.length} dòng thiếu tên sản phẩm. Không có dữ liệu nào được lưu.`,
        errors: invalidRows.map((_, i) => `Row ${i + 2}: Thiếu tên sản phẩm`),
      });
    }

    let successCount = 0;
    const errors = [];

    for (const [index, row] of data.entries()) {
      try {
        await processImportRow(row, transactionActive ? session : null, req.user._id);
        successCount++;
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err.message}`);
        if (transactionActive) {
          await session.abortTransaction();
          session.endSession();
          try { fs.unlinkSync(req.file.path); } catch (_) {}
          return res.status(422).json({
            message: `Lỗi tại dòng ${index + 2}. Đã rollback toàn bộ, không có sản phẩm nào được lưu.`,
            errors,
          });
        } else {
          session.endSession();
          try { fs.unlinkSync(req.file.path); } catch (_) {}
          return res.status(422).json({
            message: `Lỗi tại dòng ${index + 2}. Đã dừng import. Lưu ý: Một số dòng trước đó có thể đã được import do không có transaction.`,
            errors,
          });
        }
      }
    }

    if (transactionActive) await session.commitTransaction();
    session.endSession();
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({ message: 'Import thành công!', success: successCount, failed: 0, errors });
  } catch (error) {
    if (transactionActive) await session.abortTransaction();
    session.endSession();
    try { fs.unlinkSync(req.file?.path); } catch (_) {}
    res.status(500).json({ message: 'Server error during import', error: error.message });
  }
};

export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null })
      .populate({ path: 'categoryId', select: 'name parentCategory', populate: { path: 'parentCategory', select: 'name' } })
      .populate('brand', 'name');

    const buf = buildExportXLSX(products);
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('[ProductCtrl] exportProducts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────
// LEGACY / UTILITY
// ────────────────────────────────────────────────────────────────

/**
 * Called from payment.controller.js — kept for backward compatibility.
 * @deprecated Use OrderService.deductStock instead.
 */
export const updateStock = async (products) => {
  for (const { product: productId, quantity } of products) {
    const product = await Product.findById(productId);
    if (product) {
      product.stock -= quantity;
      if (product.stock < 0) product.stock = 0;
      await product.save();
    }
  }
};
