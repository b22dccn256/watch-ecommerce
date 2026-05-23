import Brand from "../models/brand.model.js";

// Lấy danh sách tất cả các brand đang hoạt động
export const getAllBrands = async (req, res) => {
    try {
        console.time('[timing] getAllBrands');
        const brands = await Brand.find({ isActive: true }).sort("name");
        console.timeEnd('[timing] getAllBrands');
        res.json(brands);
    } catch (error) {
        console.error("Error in getAllBrands:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin tạo brand mới
export const createBrand = async (req, res) => {
    try {
        const { name, logo, description, isAuthorizedDealer } = req.body;
        
        let existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return res.status(400).json({ message: "Thương hiệu này đã tồn tại" });
        }

        const newBrand = await Brand.create({
            name,
            logo,
            description,
            isAuthorizedDealer
        });

        res.status(201).json(newBrand);
    } catch (error) {
        console.error("Error in createBrand:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findById(id);
        if (!brand) return res.status(404).json({ message: "Brand not found" });

        brand.isActive = false;
        await brand.save();

        res.json({ message: "Brand deleted" });
    } catch (error) {
        console.error("Error in deleteBrand:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin cập nhật brand
export const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, description, isAuthorizedDealer } = req.body;

        const brand = await Brand.findById(id);
        if (!brand) return res.status(404).json({ message: "Brand not found" });

        if (name !== undefined) brand.name = name;
        if (logo !== undefined) brand.logo = logo;
        if (description !== undefined) brand.description = description;
        if (isAuthorizedDealer !== undefined) brand.isAuthorizedDealer = isAuthorizedDealer;

        await brand.save();
        res.json(brand);
    } catch (error) {
        console.error("Error in updateBrand:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
