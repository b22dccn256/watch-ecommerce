import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getAllBrands, createBrand, deleteBrand } from "../controllers/brand.controller.js";

const router = express.Router();

router.get("/", getAllBrands);
router.post("/", protectRoute, adminRoute, createBrand);
router.delete("/:id", protectRoute, adminRoute, deleteBrand);

export default router;
