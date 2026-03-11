import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

// Helper to clear cache
const clearCategoryCache = async () => {
    try {
        await redis.del("category:tree");
    } catch (error) {
        console.log("Redis cache clear error:", error.message);
    }
};

const buildCategoryTree = (categories, parentId = null) => {
    const categoryList = [];
    let filteredCategories;

    if (parentId == null) {
        filteredCategories = categories.filter(cat => cat.parentCategory == null);
    } else {
        filteredCategories = categories.filter(cat => cat.parentCategory && cat.parentCategory.toString() === parentId.toString());
    }

    for (let cat of filteredCategories) {
        categoryList.push({
            ...cat.toObject(),
            children: buildCategoryTree(categories, cat._id)
        });
    }
    return categoryList;
};

export const createCategory = async (req, res) => {
    try {
        const { name, parentCategory, image, isActive } = req.body;
        if (!name) return res.status(400).json({ message: "Tên danh mục là bắt buộc" });

        let slug = req.body.slug;
        if (!slug) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const randomHash = Math.random().toString(36).substring(2, 7);
            slug = `${slug}-${randomHash}`;
        }

        let level = 0;
        let ancestors = [];

        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent) return res.status(404).json({ message: "Không tìm thấy danh mục cha" });

            level = parent.level + 1;
            ancestors = [...parent.ancestors, parent._id];
        }

        let imageUrl = "";
        if (image) {
            const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "categories" });
            imageUrl = cloudinaryResponse.secure_url;
        }

        const category = await Category.create({
            name,
            slug,
            parentCategory: parentCategory || null,
            image: imageUrl,
            isActive: isActive !== undefined ? isActive : true,
            level,
            ancestors
        });

        await clearCategoryCache();
        res.status(201).json(category);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCategories = async (req, res) => {
    try {
        const { tree } = req.query;

        if (tree === "true") {
            try {
                const cache = await redis.get("category:tree");
                if (cache) {
                    return res.json(JSON.parse(cache));
                }
            } catch (redisError) {
                console.log("Redis cache error:", redisError.message);
            }
        }

        // Always sorting by level to ensure correct frontend rendering
        const categories = await Category.find().sort({ level: 1, name: 1 });

        if (tree === "true") {
            const categoryTree = buildCategoryTree(categories);
            try {
                await redis.set("category:tree", JSON.stringify(categoryTree), "EX", 3600); // 1 hour TTL
            } catch (redisError) {
                console.log("Failed to set redis cache:", redisError.message);
            }
            return res.json(categoryTree);
        }

        res.json(categories);
    } catch (error) {
        console.error("Error getting categories:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Recursive function to update children if parent changes
const updateDescendantsLevelAndAncestors = async (parentId, parentLevel, parentAncestors) => {
    const children = await Category.find({ parentCategory: parentId });
    for (let child of children) {
        child.level = parentLevel + 1;
        child.ancestors = [...parentAncestors, parentId];
        await child.save();
        // Recursively update this child's children
        await updateDescendantsLevelAndAncestors(child._id, child.level, child.ancestors);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { name, parentCategory, image, isActive } = req.body;
        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

        // 1. Loop Validation
        if (parentCategory) {
            if (categoryId === parentCategory) {
                return res.status(400).json({ message: "Danh mục không thể làm cha của chính nó" });
            }
            const isLoop = await Category.exists({
                _id: parentCategory,
                ancestors: categoryId
            });
            if (isLoop) {
                return res.status(400).json({ message: "Lặp cấu trúc vô hạn: Danh mục cha đang chọn thực chất là danh mục con/cháu của danh mục này." });
            }
        }

        // 2. Ancestor/Level Recalculation
        let levelChanged = false;
        if (parentCategory !== undefined && String(parentCategory) !== String(category.parentCategory)) {
            let newLevel = 0;
            let newAncestors = [];

            if (parentCategory) {
                const parent = await Category.findById(parentCategory);
                if (!parent) return res.status(404).json({ message: "Không tìm thấy danh mục cha" });
                newLevel = parent.level + 1;
                newAncestors = [...parent.ancestors, parent._id];
            }

            category.parentCategory = parentCategory || null;
            category.level = newLevel;
            category.ancestors = newAncestors;
            levelChanged = true;
        }

        if (name) {
            category.name = name;
            if (req.body.slug) {
                category.slug = req.body.slug;
            }
        }

        if (image) {
            // upload new image
            const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "categories" });
            const oldImage = category.image;
            category.image = cloudinaryResponse.secure_url;

            // safe delete old image
            if (oldImage) {
                const publicId = oldImage.split("/").pop().split(".")[0];
                try {
                    await cloudinary.uploader.destroy(`categories/${publicId}`);
                } catch (err) {
                    console.error("Failed to delete old category image from cloudinary", err);
                }
            }
        }

        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        // Update all descendants dynamically if tree position changed
        if (levelChanged) {
            await updateDescendantsLevelAndAncestors(category._id, category.level, category.ancestors);
        }

        await clearCategoryCache();
        res.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Validation 1: Check for children
        const hasChildren = await Category.exists({ parentCategory: categoryId });
        if (hasChildren) {
            return res.status(400).json({ message: "Không thể xóa: Vui lòng chuyển hoặc xóa các danh mục con trước." });
        }

        // Validation 2: Check for products
        const hasProducts = await Product.exists({ categoryId: categoryId, deletedAt: null }); // Handling soft delete
        if (hasProducts) {
            return res.status(400).json({ message: "Không thể xóa: Đang có sản phẩm thuộc danh mục này." });
        }

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

        // safe delete image
        if (category.image) {
            const publicId = category.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`categories/${publicId}`);
            } catch (err) {
                console.error("Failed to delete category image from cloudinary", err);
            }
        }

        await Category.findByIdAndDelete(categoryId);
        await clearCategoryCache();
        res.json({ message: "Đã xóa danh mục thành công" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
