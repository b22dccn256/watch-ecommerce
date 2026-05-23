import express from "express";
import { protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { adjustStock, getLowStockProducts, getProductInventoryLogs } from "../controllers/inventory.controller.js";

const router = express.Router();

// Tất cả endpoints đều cần quyền quản lý (admin/staff)
router.use(protectRoute, managementRoute);

router.get("/low-stock", getLowStockProducts);
router.post("/adjust", adjustStock);
router.get("/product/:productId", getProductInventoryLogs);

export default router;
