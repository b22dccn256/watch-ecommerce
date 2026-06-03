/**
 * useAuditLogs Hook
 *
 * Handles audit log fetching with smart caching to prevent duplicate requests.
 */

import { useState, useCallback, useRef } from "react";
import axios from "../lib/axios";
import { useErrorHandler } from "./useErrorHandler";

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPagination, setLogsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    limit: 10,
  });

  // Caching refs to prevent duplicate requests
  const logsFetchRef = useRef({
    promise: null,
    lastKey: "",
    lastFetched: 0,
  });

  const { handleError } = useErrorHandler();

  /**
   * Fetch audit logs with smart caching
   * Prevents duplicate requests within 1 second window
   */
  const fetchAuditLogs = useCallback(
    async (page) => {
      const key = `${page}`;
      const now = Date.now();
      const fetchState = logsFetchRef.current;

      // Return cached promise if same request pending
      if (fetchState.promise && fetchState.lastKey === key) {
        return fetchState.promise;
      }

      // Skip if same request was just made (< 1 second ago)
      if (fetchState.lastKey === key && now - fetchState.lastFetched < 1000) {
        return;
      }

      setLogsLoading(true);
      fetchState.lastKey = key;

      fetchState.promise = (async () => {
        try {
          const res = await axios.get("/auth/audit-logs", {
            params: {
              page,
              limit: 10,
            },
          });

          setAuditLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
          setLogsPagination({
            currentPage: res.data?.pagination?.currentPage ?? 1,
            totalPages: res.data?.pagination?.totalPages ?? 1,
            totalLogs: res.data?.pagination?.totalLogs ?? 0,
            limit: res.data?.pagination?.limit ?? 10,
          });
        } catch (error) {
          handleError(error, {
            context: "useAuditLogs.fetchLogs",
            showToast: false, // Don't show toast for audit logs
          });
          setAuditLogs([]);
          setLogsPagination({
            currentPage: 1,
            totalPages: 1,
            totalLogs: 0,
            limit: 10,
          });
        } finally {
          fetchState.lastFetched = Date.now();
          fetchState.promise = null;
          setLogsLoading(false);
        }
      })();

      return fetchState.promise;
    },
    [handleError],
  );

  return {
    // State
    auditLogs,
    logsLoading,
    logsPagination,

    // Actions
    fetchAuditLogs,
    setLogsPagination,
  };
};

export default useAuditLogs;
