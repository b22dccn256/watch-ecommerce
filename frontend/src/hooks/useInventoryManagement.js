import { useEffect, useState, useMemo, useCallback } from "react";
import { useInventoryStore } from "../stores/useInventoryStore";
import { useProductStore } from "../stores/useProductStore";

const PAGE_SIZE = 8;

export const useInventoryManagement = () => {
  const {
    lowStockProducts,
    fetchLowStockProducts,
    adjustStock,
    fetchProductLogs,
    inventoryLogs,
    loading,
  } = useInventoryStore();
  const { allProducts: products, fetchAllProducts } = useProductStore();

  const [selectedProduct, setSelectedProduct] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [action, setAction] = useState("IN");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLowStockProducts();
    fetchAllProducts();
  }, [fetchLowStockProducts, fetchAllProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (products || []).filter(
      (p) =>
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.brand?.name?.toLowerCase().includes(q) ||
        (typeof p.brand === "string" && p.brand.toLowerCase().includes(q)),
    );
  }, [products, search]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const warehouseValue = useMemo(
    () =>
      products?.reduce((sum, p) => sum + p.stock * (p.costPrice || 0), 0) || 0,
    [products],
  );

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const openAdjust = useCallback((productId, nextAction = "ADJUST") => {
    setSelectedProduct(productId || "");
    setAction(nextAction);
    setShowAdjustModal(true);
  }, []);

  const openBlankAdjust = useCallback(() => {
    setSelectedProduct("");
    setAction("ADJUST");
    setShowAdjustModal(true);
  }, []);

  const openLogs = useCallback(
    async (productId) => {
      setSelectedProduct(productId);
      await fetchProductLogs(productId);
      setShowLogsModal(true);
    },
    [fetchProductLogs],
  );

  const closeAdjustModal = useCallback(() => {
    setShowAdjustModal(false);
    setNote("");
    setQuantity(1);
  }, []);

  const closeLogsModal = useCallback(() => {
    setShowLogsModal(false);
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await adjustStock(selectedProduct, action, quantity, note);
      closeAdjustModal();
      await Promise.all([fetchLowStockProducts(true), fetchAllProducts(true)]);
    } catch {
      // store handles toast
    }
  };

  return {
    lowStockProducts,
    products,
    loading,
    selectedProduct,
    showAdjustModal,
    showLogsModal,
    action,
    setAction,
    quantity,
    setQuantity,
    note,
    setNote,
    search,
    handleSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts,
    filteredProducts,
    warehouseValue,
    inventoryLogs,
    openAdjust,
    openBlankAdjust,
    openLogs,
    closeAdjustModal,
    closeLogsModal,
    handleAdjustSubmit,
  };
};

export default useInventoryManagement;
