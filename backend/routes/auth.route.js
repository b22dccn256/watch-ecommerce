import express from "express";
import { login, logout, signup, refreshToken, getProfile, getAllUsers, deleteUser, updateUserRole } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.get("/users", protectRoute, adminRoute, getAllUsers);
router.delete("/users/:id", protectRoute, adminRoute, deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, updateUserRole);

export default router;
