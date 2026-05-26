import cloudinary from '../lib/cloudinary.js';
import { redis } from '../lib/redis.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import { slugifyProductName } from '../lib/product-slug.js';

/**
 * Service layer for product business logic.
 * Extracted from product.controller.js to follow Single Responsibility Principle.
 */

// ────────────────────────────────────────────────────────────────
// QUERY BUILDING
// ────────────────────────────────────────────────────────────────

const MOVEMENT_TYPES = new Set(['quartz', 'automatic', 'mechanical', 'solar']);
const SIZE_RANGES = {
  under_38: { max: 38 },
  '38_40': { min: 38, max: 40 },
  '40_42': { min: 40, max: 42 },
  '42_44': { min: 42, max: 44 },
  over_44: { min: 44 },
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const csv = (value = '') => String(value).split(',').map((item) => item.trim()).filter(Boolean);
const regexIn = (value = '') => csv(value).map((item) => new RegExp(escapeRegex(item), 'i'));

const parseWaterResistance = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const buildSizeRangeExpr = (keys) => ({
  $expr: {
    $anyElementTrue: {
      $map: {
        input: {
          $concatArrays: [
            { $ifNull: ['$sizes', []] },
            [{ $ifNull: ['$specs.case.diameter', ''] }],
          ],
        },
        as: 'rawSize',
        in: {
          $let: {
            vars: {
              size: {
                $convert: {
                  input: {
                    $replaceAll: {
                      input: {
                        $ifNull: [
                          {
                            $getField: {
                              field: 'match',
                              input: { $regexFind: { input: { $toString: '$$rawSize' }, regex: /\d+(?:[.,]\d+)?/ } },
                            },
                          },
                          '',
                        ],
                      },
                      find: ',',
                      replacement: '.',
                    },
                  },
                  to: 'double',
                  onError: null,
                  onNull: null,
                },
              },
            },
            in: {
              $or: keys.map((key) => {
                const range = SIZE_RANGES[key];
                if (!range) return false;
                const conditions = [];
                if (range.min != null) conditions.push({ $gte: ['$$size', range.min] });
                if (range.max != null) conditions.push({ $lt: ['$$size', range.max] });
                return { $and: conditions };
              }).filter(Boolean),
            },
          },
        },
      },
    },
  },
});

/**
 * Build a MongoDB filter query from URL query params.
 * @param {object} filters - Destructured from req.query
 */
export async function buildProductQuery({
  q, search, category, brands, machineType, strapMaterial, minPrice, maxPrice,
  colors, sizes, sizeRange, caseMaterial, waterResistance, glass, functions,
  minRating,
} = {}) {
  const query = { deletedAt: null };
  const and = [];

  // Support both `q` and `search` param names
  const searchTerm = q || search;
  if (searchTerm) {
    query.name = { $regex: escapeRegex(searchTerm), $options: 'i' };
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
      const brandDocs = await Brand.find({ name: { $in: names.map(n => new RegExp(`^${escapeRegex(n)}$`, 'i')) } });
      query.brand = { $in: [...validIds, ...brandDocs.map(d => d._id)] };
    } else {
      query.brand = { $in: validIds };
    }
  }

  if (machineType) {
    const types = csv(machineType).map((type) => type.toLowerCase()).filter((type) => MOVEMENT_TYPES.has(type));
    if (types.length > 0) query.type = { $in: types.map((type) => new RegExp(`^${escapeRegex(type)}$`, 'i')) };
  }

  if (strapMaterial) {
    query['specs.strap.material'] = { $in: regexIn(strapMaterial) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (colors) query.colors = { $in: regexIn(colors) };
  if (sizes)  query.sizes  = { $in: sizes.split(',')  };
  if (sizeRange) {
    const ranges = csv(sizeRange).filter((key) => SIZE_RANGES[key]);
    if (ranges.length > 0) and.push(buildSizeRangeExpr(ranges));
  }
  if (caseMaterial) query['specs.case.material'] = { $in: regexIn(caseMaterial) };
  if (glass) query['specs.glass'] = { $in: regexIn(glass) };
  if (functions) query['specs.functions'] = { $in: regexIn(functions) };
  if (waterResistance) {
    const waterConditions = csv(waterResistance).map((key) => {
      if (key === '200_plus') {
        return { $expr: { $gte: [{ $toDouble: { $ifNull: [{ $getField: { field: 'match', input: { $regexFind: { input: { $toString: '$specs.waterResistance' }, regex: /\d+(?:\.\d+)?/ } } } }, 0] } }, 200] } };
      }
      const value = parseWaterResistance(key);
      if (!value) return null;
      return { 'specs.waterResistance': new RegExp(`\\b${value}\\s*m?\\b`, 'i') };
    }).filter(Boolean);
    if (waterConditions.length > 0) and.push({ $or: waterConditions });
  }
  if (minRating) query.averageRating = { $gte: Number(minRating) };

  if (and.length > 0) query.$and = and;

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

  try {
    const response = await cloudinary.uploader.upload(newImage, { folder: 'products' });
    return response.secure_url;
  } catch (cloudinaryError) {
    console.warn('[ProductService] Cloudinary upload failed, falling back to local file upload:', cloudinaryError.message);

    // If it's a base64 string, write it to local uploads directory
    if (String(newImage).startsWith('data:image/')) {
      try {
        const matches = newImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

          const fs = await import('fs');
          const path = await import('path');
          const uploadPath = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          fs.writeFileSync(path.join(uploadPath, fileName), buffer);
          return `/uploads/${fileName}`;
        }
      } catch (localWriteError) {
        console.error('[ProductService] Local fallback write failed:', localWriteError.message);
      }
    }

    // Default placeholder fallback
    return newImage.startsWith('http') ? newImage : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
  }
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
    let cat = await Category.findOne({ name: categoryName }).session(session || undefined);
    if (!cat) {
      const createOptions = session ? { session } : {};
      [cat] = await Category.create([{
        name: categoryName,
        slug: slugifyProductName(categoryName) || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }], createOptions);
    }
    categoryId = cat._id;
  }

  // Upsert Brand
  let brandId = null;
  if (brandName) {
    let brandObj = await Brand.findOne({ name: brandName }).session(session || undefined);
    if (!brandObj) {
      const createOptions = session ? { session } : {};
      [brandObj] = await Brand.create([{ name: brandName }], createOptions);
    }
    brandId = brandObj._id;
  }

  // Map type to lowercased enum values
  let productType = 'quartz';
  if (row.type || row['Loại máy']) {
    const rawType = String(row.type || row['Loại máy']).toLowerCase().trim();
    if (rawType.includes('cơ tự động') || rawType.includes('automatic')) {
      productType = 'automatic';
    } else if (rawType.includes('cơ lên cót') || rawType.includes('mechanical') || rawType.includes('hand-wound')) {
      productType = 'mechanical';
    } else if (rawType.includes('pin') || rawType.includes('quartz')) {
      productType = 'quartz';
    } else if (rawType.includes('solar') || rawType.includes('ánh sáng')) {
      productType = 'solar';
    } else if (rawType.includes('điện tử') || rawType.includes('digital')) {
      productType = 'digital';
    } else if (rawType.includes('smart') || rawType.includes('thông minh')) {
      productType = 'smartwatch';
    } else {
      productType = 'quartz'; // fallback
    }
  }

  // Fallback description and image to satisfy required validation fields in database
  const descVal = row.description || row['Mô tả'] || `${productName} - Đồng hồ cao cấp chính hãng mang phong cách sang trọng và lịch lãm.`;
  const imgVal = row.image || row['Ảnh đại diện'] || row['Ảnh'] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

  // Upsert Product
  let product = await Product.findOne({ name: productName, deletedAt: null }).session(session || undefined);
  if (product) {
    product.description = descVal;
    if (priceVal !== undefined)         product.price       = priceVal;
    if (row.costPrice !== undefined || row['Giá nhập'] !== undefined) {
      product.costPrice = row.costPrice ?? row['Giá nhập'];
    }
    product.image       = imgVal;
    if (categoryId)                     product.categoryId  = categoryId;
    if (brandId)                        product.brand       = brandId;
    product.type        = productType;
    if (stockVal !== undefined)         product.stock       = stockVal;
    product.$locals = { userId };
    const saveOptions = session ? { session } : {};
    await product.save(saveOptions);
  } else {
    const createOptions = session ? { session } : {};
    const costPriceVal = row.costPrice ?? row['Giá nhập'] ?? Math.round(priceVal * 0.7);
    await Product.create([{
      name:        productName,
      description: descVal,
      price:       priceVal,
      costPrice:   costPriceVal,
      image:       imgVal,
      categoryId,
      brand:       brandId,
      type:        productType,
      stock:       stockVal,
      isActive:    true,
    }], createOptions);
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
