import express from "express";
import { protectRoute, adminRoute, managementRoute } from "../middleware/auth.middleware.js";
import { getBanners, createBanner, deleteBanner, toggleBannerStatus } from "../controllers/banner.controller.js";

const router = express.Router();

router.get("/", getBanners);
router.post("/", protectRoute, managementRoute, createBanner);
router.delete("/:id", protectRoute, adminRoute, deleteBanner);
router.patch("/:id/toggle", protectRoute, managementRoute, toggleBannerStatus);

export default router;
