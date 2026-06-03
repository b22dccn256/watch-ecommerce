/**
 * useUsersData Hook
 *
 * Handles user data fetching, pagination, search, role filtering with smart caching.
 * Implements request deduplication to prevent duplicate API calls.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useErrorHandler } from "./useErrorHandler";

export const useUsersData = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Caching refs to prevent duplicate requests
  const searchRef = useRef(search);
  const usersFetchRef = useRef({
    promise: null,
    lastKey: "",
    lastFetched: 0,
  });

  const { handleError } = useErrorHandler();

  // Update search ref when search changes
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  /**
   * Fetch users with smart caching
   * Prevents duplicate requests within 1 second window
   */
  const fetchUsers = useCallback(
    async (page, role, keyword) => {
      const key = `${page}|${role}|${keyword}`;
      const now = Date.now();
      const fetchState = usersFetchRef.current;

      // Return cached promise if same request pending
      if (fetchState.promise && fetchState.lastKey === key) {
        return fetchState.promise;
      }

      // Skip if same request was just made (< 1 second ago)
      if (fetchState.lastKey === key && now - fetchState.lastFetched < 1000) {
        return;
      }

      setLoading(true);
      fetchState.lastKey = key;

      fetchState.promise = (async () => {
        try {
          const res = await axios.get("/auth/users", {
            params: {
              page,
              limit: 10,
              search: keyword,
              role,
            },
          });

          setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
          setPagination({
            currentPage: res.data?.pagination?.currentPage ?? 1,
            totalPages: res.data?.pagination?.totalPages ?? 1,
            totalUsers: res.data?.pagination?.totalUsers ?? 0,
            limit: res.data?.pagination?.limit ?? 10,
          });
        } catch (error) {
          handleError(error, {
            context: "useUsersData.fetchUsers",
            showToast: true,
            toastMessage: "Không thể tải danh sách người dùng",
          });
          setUsers([]);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalUsers: 0,
            limit: 10,
          });
        } finally {
          fetchState.lastFetched = Date.now();
          fetchState.promise = null;
          setLoading(false);
        }
      })();

      return fetchState.promise;
    },
    [handleError],
  );

  /**
   * Delete a user
   */
  const handleDeleteUser = useCallback(
    async (userId, userName) => {
      try {
        await axios.delete(`/auth/users/${userId}`);
        toast.success(`Đã xóa tài khoản ${userName}`);
        // Refetch to update list
        await fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersData.deleteUser",
          showToast: true,
          toastMessage: "Lỗi khi xóa tài khoản",
        });
        return false;
      }
    },
    [pagination.currentPage, roleFilter, fetchUsers, handleError],
  );

  /**
   * Update user role
   */
  const handleUpdateRole = useCallback(
    async (userId, newRole, userName) => {
      try {
        await axios.patch(`/auth/users/${userId}/role`, { role: newRole });
        toast.success(`Đã đổi vai trò ${userName} thành ${newRole}`);
        // Refetch to update list
        await fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersData.updateRole",
          showToast: true,
          toastMessage: "Lỗi khi đổi vai trò",
        });
        return false;
      }
    },
    [pagination.currentPage, roleFilter, fetchUsers, handleError],
  );

  /**
   * Bulk delete users
   */
  const handleBulkDeleteUsers = useCallback(
    async (userIds) => {
      try {
        await axios.delete("/auth/users", { data: { ids: userIds } });
        toast.success(`Đã xóa ${userIds.length} tài khoản thành công`);
        // Refetch to update list
        await fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersData.bulkDeleteUsers",
          showToast: true,
          toastMessage: "Lỗi khi xóa hàng loạt tài khoản",
        });
        return false;
      }
    },
    [pagination.currentPage, roleFilter, fetchUsers, handleError],
  );

  return {
    // State
    users,
    loading,
    pagination,
    search,
    roleFilter,

    // Actions
    setSearch,
    setRoleFilter,
    setPagination,
    fetchUsers,
    handleDeleteUser,
    handleUpdateRole,
    handleBulkDeleteUsers,
  };
};

export default useUsersData;
