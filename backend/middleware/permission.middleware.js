import AuditLog from "../models/auditLog.model.js";

/**
 * Utility to log admin/staff actions
 */
export const logAction = async ({ req, action, targetId = null, targetModel = null, changes = [], details = "" }) => {
	try {
		await AuditLog.create({
			userId: req.user._id,
			action,
			targetId,
			targetModel,
			changes,
			ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
			userAgent: req.headers["user-agent"] || "Unknown",
			details,
		});
	} catch (error) {
		console.error("Failed to create audit log:", error.message);
	}
};

/**
 * Middleware to check permissions and log access denials
 * @param {Array} excludedRoles - Roles that are NOT allowed
 * @param {string} actionName - Name of the action for logging
 */
export const checkPermission = (excludedRoles = [], actionName = "UNAUTHORIZED_ACCESS") => {
	return async (req, res, next) => {
		if (excludedRoles.includes(req.user.role)) {
			// Log the denied attempt
			await logAction({
				req,
				action: `ACCESS_DENIED:${actionName}`,
				details: `User with role ${req.user.role} tried to perform a restricted action.`,
			});

			return res.status(403).json({
				message: "Bạn không có quyền thực hiện hành động này",
				code: "PERMISSION_DENIED",
			});
		}
		next();
	};
};
