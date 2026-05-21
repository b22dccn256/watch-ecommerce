import cloudinary from '../lib/cloudinary.js';
import { redis } from '../lib/redis.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import mongoose from 'mongoose';
import XLSX from 'xlsx';

/**
 * Service layer for product business logic.
 * Extracted from product.controller.js to follow Single Responsibility Principle.
 */

// ────────────────────────────────────────────────────────────────
// QUERY BUILDING
// ────────────────────────────────────────────────────────────────

/**
 * Build a MongoDB filter query from URL query params.
 * @param {object} filters - Destructured from req.query
 */
export async function buildProductQuery({ q, search, category, brands, machineType, strapMaterial, minPrice, maxPrice, colors, sizes, minRating } = {}) {
  const query = { deletedAt: null };

  // Support both `q` and `search` param names
  const searchTerm = q || search;
  if (searchTerm) {
    query.name = { $regex: searchTerm, $options: 'i' };
  }

  if (category) {
    const catObj = await Category.findOne({ slug: category });
    if (catObj) {
      const descendantIds = await Category.distinct('_id', { ancestors: catObj._id });
      query.categoryId = { $in: [catObj._id, ...descendantIds] };
    } else if (mongoose.Types.ObjectId.isValid(category)) {
      const descendantIds = await Category.distinct('_id', { ancestors: category });
      query.categoryId = { $in: [category, ...descendantIds] };
    }
  }

  if (brands) {
    const brandArr = brands.split(',');
    const validIds = brandArr.filter(b => mongoose.Types.ObjectId.isValid(b));
    const names    = brandArr.filter(b => !mongoose.Types.ObjectId.isValid(b));
    if (names.length > 0) {
      const brandDocs = await Brand.find({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
      query.brand = { $in: [...validIds, ...brandDocs.map(d => d._id)] };
    } else {
      query.brand = { $in: validIds };
    }
  }

  if (machineType) query.type = { $in: machineType.split(',').map(t => new RegExp(`^${t.trim()}$`, 'i')) };

  if (strapMaterial) {
    query['specs.strap.material'] = { $in: strapMaterial.split(',').map(s => new RegExp(s.trim(), 'i')) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (colors) query.colors = { $in: colors.split(',') };
  if (sizes)  query.sizes  = { $in: sizes.split(',')  };
  if (minRating) query.averageRating = { $gte: Number(minRating) };

  return query;
}

/**
 * Apply sort to a Mongoose query chain.
 */
export function applyProductSort(productsQuery, sort) {
  const sortMap = {
    popular:      { createdAt: -1 },
    price_asc:    { price: 1 },
    price_desc:   { price: -1 },
    newest:       { createdAt: -1 },
    best_selling: { salesCount: -1, createdAt: -1 },
    name_asc:     { name: 1 },
    name_desc:    { name: -1 },
  };
  return productsQuery.sort(sortMap[sort] || { createdAt: -1 });
}

// ────────────────────────────────────────────────────────────────
// IMAGE HANDLING
// ────────────────────────────────────────────────────────────────

/**
 * Upload a new image to Cloudinary and optionally delete the old one.
 * @param {string} newImage   - base64 or URL of new image
 * @param {string} oldImage   - existing Cloudinary URL (to delete on replace)
 * @returns {Promise<string>} - new secure_url from Cloudinary
 */
export async function handleProductImage(newImage, oldImage = null) {
  if (!newImage || newImage === oldImage) return oldImage;

  // Delete old image if it exists and is different
  if (oldImage) {
    try {
      const publicId = oldImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);
    } catch (err) {
      console.error('[ProductService] Failed to delete old Cloudinary image (swallowed):', err.message);
    }
  }

  const response = await cloudinary.uploader.upload(newImage, { folder: 'products' });
  return response.secure_url;
}

// ────────────────────────────────────────────────────────────────
// CACHE
// ────────────────────────────────────────────────────────────────

/**
 * Refresh the featured_products Redis cache.
 */
export async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set('featured_products', JSON.stringify(featuredProducts));
  } catch (error) {
    console.error('[ProductService] Failed to update featured_products cache:', error.message);
  }
}

// ────────────────────────────────────────────────────────────────
// EXCEL IMPORT / EXPORT
// ────────────────────────────────────────────────────────────────

/**
 * Parse a single Excel import row into a product object.
 * Creates or upserts Category and Brand as needed.
 * @param {object} row         - raw row from XLSX.utils.sheet_to_json
 * @param {object} session     - Mongoose session for transactions
 * @param {string} userId      - admin user ID for audit
 * @returns {Promise<void>}    - saves product to DB
 */
export async function processImportRow(row, session, userId) {
  const productName  = row.name        || row['Tên sản phẩm'];
  const categoryName = row.category    || row['Danh mục'];
  const brandName    = row.brand       || row['Thương hiệu'];
  const priceVal     = row.price       ?? row['Giá bán']   ?? 0;
  const stockVal     = row.stock       ?? row['Tồn kho']   ?? 0;

  if (!productName) throw new Error('Thiếu tên sản phẩm');

  // Upsert Category
  let categoryId = null;
  if (categoryName) {
    let cat = await Category.findOne({ name: categoryName }).session(session);
    if (!cat) {
      [cat] = await Category.create([{
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }], { session });
    }
    categoryId = cat._id;
  }

  // Upsert Brand
  let brandId = null;
  if (brandName) {
    let brandObj = await Brand.findOne({ name: brandName }).session(session);
    if (!brandObj) {
      [brandObj] = await Brand.create([{ name: brandName }], { session });
    }
    brandId = brandObj._id;
  }

  // Upsert Product
  let product = await Product.findOne({ name: productName, deletedAt: null }).session(session);
  if (product) {
    if (row.description)               product.description = row.description;
    if (priceVal !== undefined)         product.price       = priceVal;
    if (row.costPrice !== undefined)    product.costPrice   = row.costPrice;
    if (row.image)                      product.image       = row.image;
    if (categoryId)                     product.categoryId  = categoryId;
    if (brandId)                        product.brand       = brandId;
    if (row.type)                       product.type        = String(row.type).toLowerCase();
    if (stockVal !== undefined)         product.stock       = stockVal;
    product.$locals = { userId };
    await product.save({ session });
  } else {
    await Product.create([{
      name:        productName,
      description: row.description || '',
      price:       priceVal,
      costPrice:   row.costPrice || Math.round(priceVal * 0.7),
      image:       row.image || '',
      categoryId,
      brand:       brandId,
      type:        row.type ? String(row.type).toLowerCase() : 'quartz',
      stock:       stockVal,
      isActive:    true,
    }], { session });
  }
}

/**
 * Build preview data from a parsed Excel sheet (no DB writes).
 */
export function buildImportPreview(data) {
  return data.slice(0, 50).map((row, idx) => ({
    row:        idx + 2,
    name:       row.name       || row['Tên sản phẩm']  || '',
    brand:      row.brand      || row['Thương hiệu']   || '',
    category:   row.category   || row['Danh mục']      || '',
    price:      row.price      || row['Giá bán']       || 0,
    stock:      row.stock      || row['Tồn kho']       || 0,
    type:       row.type       || row['Loại máy']      || '',
    validation: (!row.name && !row['Tên sản phẩm']) ? '⚠ Thiếu tên' : 'OK',
  }));
}

/**
 * Build an XLSX buffer for product export.
 * @param {Array} products - populated Mongoose documents
 * @returns {Buffer}
 */
export function buildExportXLSX(products) {
  const data = products.map(p => ({
    'Tên sản phẩm': p.name,
    'Thương hiệu':  p.brand ? p.brand.name : 'Khác',
    'Danh mục':     p.categoryId ? p.categoryId.name : '',
    'Loại máy':     p.type,
    'Giá bán':      p.price,
    'Giá nhập':     p.costPrice || 0,
    'Tồn kho':      p.stock,
    'Lượt bán':     p.salesCount || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export default {
  buildProductQuery,
  applyProductSort,
  handleProductImage,
  updateFeaturedProductsCache,
  processImportRow,
  buildImportPreview,
  buildExportXLSX,
};
