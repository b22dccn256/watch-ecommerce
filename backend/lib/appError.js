export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (resource = "Resource") =>
  new AppError(`${resource} not found`, 404, "NOT_FOUND");

export const badRequest = (message) =>
  new AppError(message, 400, "BAD_REQUEST");

export const unauthorized = (message = "Unauthorized") =>
  new AppError(message, 401, "UNAUTHORIZED");

export const forbidden = (message = "Forbidden") =>
  new AppError(message, 403, "FORBIDDEN");
