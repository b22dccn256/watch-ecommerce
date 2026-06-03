import express from "express";
import adminCtrl from "../controllers/admin.ipn.controller.js";
import {
  protectRoute,
  managementRoute,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/failed", protectRoute, managementRoute, adminCtrl.listFailedIPNs);
router.post("/link", protectRoute, managementRoute, adminCtrl.linkIPNToOrder);
router.get("/", protectRoute, managementRoute, adminCtrl.renderReconcilePage);

export default router;
