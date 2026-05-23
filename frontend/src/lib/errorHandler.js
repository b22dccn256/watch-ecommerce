/**
 * Centralized Error Handler
 * 
 * Provides consistent error parsing and handling across the application.
 * Supports multiple error sources: API responses, JavaScript errors, network errors.
 */

/**
 * Standard error response format
 * @typedef {Object} StandardError
 * @property {string} code - Error code (e.g., 'AUTH_FAILED', 'VALIDATION_ERROR')
 * @property {string} message - User-friendly error message
 * @property {string} details - Technical details
 * @property {number} statusCode - HTTP status code
 * @property {Object} originalError - Original error object
 */

/**
 * Parse error from various sources into standardized format
 * @param {Error|AxiosError|Object} error - The error object
 * @returns {StandardError}
 */
export const parseError = (error) => {
  // Axios error (HTTP)
  if (error.response) {
    return {
      code: error.response.data?.code || `HTTP_${error.response.status}`,
      message: error.response.data?.message || error.message || 'Lỗi máy chủ',
      details: error.response.data?.details || error.response.statusText,
      statusCode: error.response.status,
      originalError: error,
    };
  }

  // Network error (no response from server)
  if (error.request && !error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
      details: error.message,
      statusCode: 0,
      originalError: error,
    };
  }

  // Standard JavaScript Error
  if (error instanceof Error) {
    return {
      code: 'APP_ERROR',
      message: error.message || 'Lỗi không xác định',
      details: error.stack,
      statusCode: null,
      originalError: error,
    };
  }

  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Đã xảy ra lỗi không xác định',
    details: JSON.stringify(error),
    statusCode: null,
    originalError: error,
  };
};

/**
 * Get user-friendly error message
 * @param {Error|AxiosError|Object} error - The error object
 * @returns {string} - User-friendly message
 */
export const getErrorMessage = (error) => {
  const parsed = parseError(error);
  return parsed.message;
};

/**
 * Check if error is due to authentication
 * @param {Error|AxiosError|Object} error - The error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  const parsed = parseError(error);
  return (
    parsed.statusCode === 401 ||
    parsed.code?.includes('AUTH') ||
    parsed.code?.includes('UNAUTHORIZED')
  );
};

/**
 * Check if error is validation-related
 * @param {Error|AxiosError|Object} error - The error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  const parsed = parseError(error);
  return (
    parsed.statusCode === 400 ||
    parsed.code?.includes('VALIDATION')
  );
};

/**
 * Check if error is a network issue
 * @param {Error|AxiosError|Object} error - The error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  const parsed = parseError(error);
  return parsed.code === 'NETWORK_ERROR' || parsed.statusCode === 0;
};

/**
 * Log error to console with formatting
 * @param {string} context - Where the error occurred (e.g., 'ProductsList.fetch')
 * @param {Error|AxiosError|Object} error - The error object
 */
export const logError = (context, error) => {
  const parsed = parseError(error);
  console.error(`[${context}] ${parsed.code}: ${parsed.message}`, {
    details: parsed.details,
    originalError: parsed.originalError,
  });
};

/**
 * Common error codes
 */
export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
};

/**
 * Map HTTP status codes to error messages
 */
const HTTP_STATUS_MESSAGES = {
  400: 'Yêu cầu không hợp lệ',
  401: 'Phiên làm việc hết hạn, vui lòng đăng nhập lại',
  403: 'Bạn không có quyền thực hiện hành động này',
  404: 'Không tìm thấy',
  409: 'Dữ liệu đã tồn tại hoặc xung đột',
  422: 'Dữ liệu không hợp lệ',
  429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
  503: 'Dịch vụ hiện không khả dụng',
};

/**
 * Get appropriate message for HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Error message
 */
export const getHttpErrorMessage = (statusCode) => {
  return HTTP_STATUS_MESSAGES[statusCode] || 'Lỗi không xác định';
};

export default {
  parseError,
  getErrorMessage,
  isAuthError,
  isValidationError,
  isNetworkError,
  logError,
  ERROR_CODES,
  getHttpErrorMessage,
};
