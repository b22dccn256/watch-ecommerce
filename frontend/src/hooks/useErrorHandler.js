/**
 * useErrorHandler Hook
 *
 * Provides consistent error handling pattern for all components and async operations.
 */

import { useCallback } from "react";
import toast from "react-hot-toast";
import useErrorStore from "../stores/useErrorStore";
import {
  parseError,
  getErrorMessage,
  isAuthError,
  isValidationError,
  logError,
} from "../lib/errorHandler";

/**
 * Custom hook for error handling
 * @returns {Object} - Error handling utilities
 */
export const useErrorHandler = () => {
  const setError = useErrorStore((state) => state.setError);
  const clearError = useErrorStore((state) => state.clearError);

  /**
   * Handle an error with optional logging, storing, and toast notification
   * @param {Error|AxiosError|Object} error - The error object
   * @param {Object} options - Handling options
   * @param {string} options.context - Where the error occurred (for logging)
   * @param {boolean} options.showToast - Show toast notification (default: true)
   * @param {boolean} options.showConsole - Log to console (default: true)
   * @param {boolean} options.store - Store in error store (default: true)
   * @param {number} options.duration - Toast duration (default: 5000ms)
   * @param {Function} options.onAuthError - Callback for auth errors
   * @param {Function} options.onValidationError - Callback for validation errors
   */
  const handleError = useCallback(
    (error, options = {}) => {
      const {
        context = "Unknown",
        showToast = true,
        showConsole = true,
        store = true,
        duration = 5000,
        onAuthError,
        onValidationError,
      } = options;

      const parsed = parseError(error);
      const message = getErrorMessage(error);

      // Log to console if enabled
      if (showConsole) {
        logError(context, error);
      }

      // Store in error store if enabled
      if (store) {
        setError(error, { duration });
      }

      // Show toast if enabled
      if (showToast) {
        toast.error(message, { duration });
      }

      // Handle specific error types
      if (isAuthError(error)) {
        onAuthError?.();
      }

      if (isValidationError(error)) {
        onValidationError?.(parsed);
      }

      return parsed;
    },
    [setError],
  );

  /**
   * Wrap an async function with error handling
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Error handling options
   * @returns {Function} - Wrapped function
   */
  const withErrorHandling = useCallback(
    (fn, options = {}) => {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, {
            context: fn.name || "AsyncFunction",
            ...options,
          });
          throw error;
        }
      };
    },
    [handleError],
  );

  /**
   * Handle error in try-catch with custom message
   * @param {Error} error - The error
   * @param {string} fallbackMessage - Message if error parsing fails
   * @param {Object} options - Handling options
   */
  const handleCustomError = useCallback(
    (error, fallbackMessage = "Đã xảy ra lỗi", options = {}) => {
      const message = getErrorMessage(error) || fallbackMessage;
      const { duration = 5000 } = options;

      setError(error, { duration });
      toast.error(message, { duration });

      return message;
    },
    [setError],
  );

  /**
   * Show validation errors as individual toasts
   * @param {Object} validationErrors - Object with field: message pairs
   */
  const showValidationErrors = useCallback((validationErrors) => {
    Object.entries(validationErrors).forEach(([field, message]) => {
      toast.error(`${field}: ${message}`, { duration: 4000 });
    });
  }, []);

  /**
   * Handle API response errors gracefully
   * @param {AxiosError} error - Axios error object
   * @param {Object} options - Handling options
   */
  const handleApiError = useCallback(
    (error, options = {}) => {
      const { context = "API Call", customMessages = {}, ...rest } = options;

      const parsed = parseError(error);
      const customMessage = customMessages[parsed.code];

      if (customMessage) {
        toast.error(customMessage, { duration: 5000 });
        return parsed;
      }

      return handleError(error, { context, ...rest });
    },
    [handleError],
  );

  return {
    handleError,
    handleApiError,
    handleCustomError,
    withErrorHandling,
    showValidationErrors,
    clearError,
  };
};

export default useErrorHandler;
