import { useEffect, useState, useCallback, useRef } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const DEBOUNCE_MS = 400;

export const useOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({
    totalOrders: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [stats, setStats] = useState({ pendingCount: 0, returnedCount: 0 });

  const debounceRef = useRef(null);

  const fetchOrders = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const res = await axios.get("/orders", {
          params: {
            page: params.page ?? page,
            limit,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
          },
        });

        const data = res.data;
        setOrders(Array.isArray(data) ? data : data?.orders || []);
        if (data?.pagination) setPagination(data.pagination);
        if (data?.stats) setStats(data.stats);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Không thể tải danh sách đơn hàng",
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter],
  );

  // Initial + pagination/filter changes
  useEffect(() => {
    fetchOrders({ page, status: statusFilter, search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // Debounced search
  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      setPage(1);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchOrders({ page: 1, search: value, status: statusFilter });
      }, DEBOUNCE_MS);
    },
    [fetchOrders, statusFilter],
  );

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const exportCsv = useCallback(() => {
    if (!orders.length) {
      toast("Không có đơn để xuất");
      return;
    }
    const rows = [
      "Mã Đơn,Khách hàng,SĐT,Tổng tiền,PT Thanh toán,Trạng thái,Ngày đặt",
    ];
    orders.forEach((o) => {
      rows.push(
        [
          o.orderCode || o._id,
          o.shippingDetails?.fullName || o.user?.name || "N/A",
          o.shippingDetails?.phoneNumber || "",
          o.totalAmount || "",
          o.paymentMethod || "",
          o.status || "",
          o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "",
        ]
          .map(String)
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orders]);

  return {
    orders,
    loading,
    search,
    onSearchChange: handleSearchChange,
    statusFilter,
    onStatusChange: handleStatusChange,
    page,
    setPage,
    pagination,
    stats,
    fetchOrders,
    exportCsv,
  };
};

export default useOrdersList;
