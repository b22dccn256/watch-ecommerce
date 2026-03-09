import express from "express";
import { getWishlistProducts, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getWishlistProducts);
router.post("/", protectRoute, addToWishlist);
router.delete("/:id", protectRoute, removeFromWishlist);

export default router;
