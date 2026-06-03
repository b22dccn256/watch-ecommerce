import express from "express";
import {
  addToCart,
  getCartProducts,
  removeAllFromCart,
  updateQuantity,
  mergeCart,
  updateCartItemAttributes,
  calculateCartTotals,
} from "../controllers/cart.controller.js";
import { protectRoute, optionalRoute } from "../middleware/auth.middleware.js";
import {
  validateBody,
  cartSchemas,
} from "../middleware/validation.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, validateBody(cartSchemas.addItem), addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put(
  "/:id",
  protectRoute,
  validateBody(cartSchemas.updateItem),
  updateQuantity,
);
router.put("/:id/options", protectRoute, updateCartItemAttributes);
router.post("/merge", protectRoute, mergeCart);
router.post("/calculate", optionalRoute, calculateCartTotals);

export default router;
