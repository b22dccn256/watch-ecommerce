import { AppError } from "../lib/appError.js";
import { sanitizeErrorResponse } from "../lib/sanitize-response.js";

export const notFoundHandler = (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;
  const payload = sanitizeErrorResponse(err);
  if (err.code && !payload.code) payload.code = err.code;
  if (process.env.NODE_ENV !== "production" && err.stack)
    payload.stack = err.stack;

  res.status(status).json(payload);
};
