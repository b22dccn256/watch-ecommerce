import express from "express";
import { addToCart, getCartProducts, removeAllFromCart, updateQuantity, mergeCart } from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);
router.post("/merge", protectRoute, mergeCart);

export default router;
