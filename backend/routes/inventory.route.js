import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { adjustStock, getLowStockProducts, getProductInventoryLogs } from "../controllers/inventory.controller.js";

const router = express.Router();

// Tất cả endpoints đều cần quyền admin
router.use(protectRoute, adminRoute);

router.get("/low-stock", getLowStockProducts);
router.post("/adjust", adjustStock);
router.get("/product/:productId", getProductInventoryLogs);

export default router;
