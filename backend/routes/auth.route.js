import express from "express";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
  getAllUsers,
  getAuditLogs,
  deleteUser,
  bulkDeleteUsers,
  updateUserRole,
  updateProfile,
  changePassword,
  verifyOTP,
  resendOTP,
  verifyEmail,
  resendVerificationEmail,
  adjustLoyaltyPoints,
  updateUserAdminNotes,
  forgotPassword,
  resetPassword,
  getVerificationLinkDebug,
} from "../controllers/auth.controller.js";
import {
  protectRoute,
  requireEmailVerified,
  resendVerificationLimiter,
  adminRoute,
  managementRoute,
} from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { authSchemas } from "../middleware/validation.middleware.js";

const router = express.Router();

router.post("/signup", validateBody(authSchemas.signup), signup);
router.post("/login", validateBody(authSchemas.login), login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
// resendVerificationEmail supports both authenticated and public (email in body) flows
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  resendVerificationEmail,
);
router.post("/verify-email", verifyEmail);
router.get("/verify-email", verifyEmail);
// DEBUG endpoint - get verification link directly (dev only)
router.post("/debug/verification-link", getVerificationLinkDebug);
router.post(
  "/forgot-password",
  validateBody(authSchemas.forgotPassword),
  forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(authSchemas.resetPassword),
  resetPassword,
);
router.patch(
  "/profile",
  protectRoute,
  requireEmailVerified,
  validateBody(authSchemas.updateProfile),
  updateProfile,
);
router.patch(
  "/change-password",
  protectRoute,
  requireEmailVerified,
  validateBody(authSchemas.changePassword),
  changePassword,
);
router.get("/users", protectRoute, managementRoute, getAllUsers);
router.get("/audit-logs", protectRoute, adminRoute, getAuditLogs);
router.delete("/users", protectRoute, adminRoute, bulkDeleteUsers);
router.delete("/users/:id", protectRoute, adminRoute, deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, updateUserRole);
// D1: Loyalty Points
router.patch(
  "/users/:id/loyalty",
  protectRoute,
  managementRoute,
  adjustLoyaltyPoints,
);
// D2: Admin notes & tags
router.patch(
  "/users/:id/admin-notes",
  protectRoute,
  managementRoute,
  updateUserAdminNotes,
);

export default router;
