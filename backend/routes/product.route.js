import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getProductsByCategory,
	getRecommendedProducts,
	toggleFeaturedProduct,
	importProducts,
	previewImportProducts,
	getSuggestions,
	getProductById,
	updateProduct,
	getInventoryAlerts,
    exportProducts,
} from "../controllers/product.controller.js";
import { adminRoute, managementRoute, protectRoute } from "../middleware/auth.middleware.js";

import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/import/preview", protectRoute, managementRoute, upload.single("file"), previewImportProducts);
router.post("/import", protectRoute, managementRoute, upload.single("file"), importProducts);
router.get("/export", protectRoute, managementRoute, exportProducts);
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/suggestions", getSuggestions);
router.get("/inventory/alerts", protectRoute, managementRoute, getInventoryAlerts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.get("/:id", getProductById);
router.post("/", protectRoute, managementRoute, createProduct);
router.put("/:id", protectRoute, managementRoute, updateProduct);
router.patch("/:id", protectRoute, managementRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
