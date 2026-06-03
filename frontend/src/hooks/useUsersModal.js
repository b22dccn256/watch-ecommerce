/**
 * useUsersModal Hook
 *
 * Handles all modal states and related actions for UsersTab.
 * Replaces scattered useState calls for modals and confirmations.
 */

import { useState, useCallback } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useErrorHandler } from "./useErrorHandler";

export const useUsersModal = () => {
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailTab, setUserDetailTab] = useState("info");
  const [userOrders, setUserOrders] = useState([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const { handleError } = useErrorHandler();

  /**
   * Open user detail modal
   */
  const openUserDetail = useCallback((user) => {
    setSelectedUser(user);
    setUserDetailTab("info");
    setUserOrders([]);
  }, []);

  /**
   * Close user detail modal
   */
  const closeUserDetail = useCallback(() => {
    setSelectedUser(null);
    setUserDetailTab("info");
    setUserOrders([]);
  }, []);

  /**
   * Fetch user orders
   */
  const fetchUserOrders = useCallback(
    async (userId) => {
      setUserOrdersLoading(true);
      try {
        const res = await axios.get(`/orders?userId=${userId}&limit=10`);
        setUserOrders(res.data?.orders || []);
      } catch (error) {
        handleError(error, {
          context: "useUsersModal.fetchUserOrders",
          showToast: false,
        });
        setUserOrders([]);
      } finally {
        setUserOrdersLoading(false);
      }
    },
    [handleError],
  );

  /**
   * Update user tags
   */
  const handleUpdateTags = useCallback(
    async (userId, tags) => {
      try {
        const res = await axios.patch(`/auth/users/${userId}/admin-notes`, {
          tags,
        });
        setSelectedUser(res.data.user);
        toast.success("Đã cập nhật tags");
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersModal.updateTags",
          showToast: true,
          toastMessage: "Lỗi khi cập nhật tags",
        });
        return false;
      }
    },
    [handleError],
  );

  /**
   * Update user admin notes
   */
  const handleUpdateNotes = useCallback(
    async (userId, adminNotes) => {
      try {
        await axios.patch(`/auth/users/${userId}/admin-notes`, { adminNotes });
        toast.success("Đã cập nhật ghi chú");
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersModal.updateNotes",
          showToast: true,
          toastMessage: "Lỗi khi cập nhật ghi chú",
        });
        return false;
      }
    },
    [handleError],
  );

  /**
   * Confirm loyalty points adjustment
   */
  const handleConfirmLoyalty = useCallback(
    async (value) => {
      if (value === null || value === "") return false;
      if (isNaN(Number(value))) {
        toast.error("Vui lòng nhập số hợp lệ");
        return false;
      }

      try {
        const res = await axios.patch(
          `/auth/users/${selectedUser._id}/loyalty`,
          {
            delta: Number(value),
          },
        );
        toast.success(res.data.message);
        setSelectedUser((prev) => ({
          ...prev,
          rewardPoints: res.data.rewardPoints,
        }));
        setShowLoyaltyModal(false);
        return true;
      } catch (error) {
        handleError(error, {
          context: "useUsersModal.confirmLoyalty",
          showToast: true,
          toastMessage: "Lỗi khi điều chỉnh điểm",
        });
        return false;
      }
    },
    [selectedUser, handleError],
  );

  /**
   * Close menu
   */
  const closeMenu = useCallback(() => {
    setOpenMenu(null);
  }, []);

  return {
    // Modal states
    selectedUser,
    setSelectedUser,
    userDetailTab,
    setUserDetailTab,
    userOrders,
    setUserOrders,
    userOrdersLoading,
    setUserOrdersLoading,
    showLogDetail,
    setShowLogDetail,
    confirmConfig,
    setConfirmConfig,
    showLoyaltyModal,
    setShowLoyaltyModal,
    openMenu,
    setOpenMenu,

    // Modal actions
    openUserDetail,
    closeUserDetail,
    fetchUserOrders,
    handleUpdateTags,
    handleUpdateNotes,
    handleConfirmLoyalty,
    closeMenu,
  };
};

export default useUsersModal;
