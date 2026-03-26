import express from "express";
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { adminRoute, protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", protectRoute, managementRoute, createCategory);
router.put("/:id", protectRoute, managementRoute, updateCategory);
router.delete("/:id", protectRoute, adminRoute, checkPermission(["staff"], "DELETE_CATEGORY"), deleteCategory);

export default router;
