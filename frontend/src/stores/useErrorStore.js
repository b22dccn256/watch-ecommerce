/**
 * Error Store - Zustand
 * 
 * Centralized error state management for the entire application.
 * Handles showing/hiding errors, storing error history, and clearing errors.
 */

import { create } from 'zustand';
import { parseError } from '../lib/errorHandler';

const useErrorStore = create((set, get) => ({
  // Current error being displayed
  currentError: null,
  
  // Error history for debugging
  errorHistory: [],
  
  // Maximum errors to keep in history
  maxHistorySize: 50,

  /**
   * Set an error to be displayed
   * @param {Error|AxiosError|Object} error - The error object
   * @param {Object} options - Additional options
   * @param {number} options.duration - Duration to show error (ms), null for persistent
   */
  setError: (error, options = {}) => {
    const { duration = 5000 } = options;
    const parsed = parseError(error);

    set((state) => {
      const newHistory = [
        {
          ...parsed,
          timestamp: new Date().toISOString(),
        },
        ...state.errorHistory,
      ].slice(0, state.maxHistorySize);

      return {
        currentError: parsed,
        errorHistory: newHistory,
      };
    });

    // Auto-clear error after duration
    if (duration !== null) {
      setTimeout(() => {
        const state = get();
        // Only clear if it's the same error
        if (state.currentError?.timestamp === parsed.timestamp) {
          set({ currentError: null });
        }
      }, duration);
    }
  },

  /**
   * Clear current error
   */
  clearError: () => {
    set({ currentError: null });
  },

  /**
   * Clear all error history
   */
  clearHistory: () => {
    set({ errorHistory: [] });
  },

  /**
   * Get last error from history
   */
  getLastError: () => {
    const state = get();
    return state.errorHistory[0] || null;
  },

  /**
   * Get errors by code
   */
  getErrorsByCode: (code) => {
    const state = get();
    return state.errorHistory.filter((e) => e.code === code);
  },
}));

export default useErrorStore;
