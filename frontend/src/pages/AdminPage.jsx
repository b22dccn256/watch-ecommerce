import {
  PlusCircle,
  ShoppingBasket,
  LayoutDashboard,
  Users,
  Mail,
  Megaphone,
  ShieldCheck,
  Archive,
  Menu,
  X,
  Watch,
  LayoutTemplate,
  Tag,
  MessageSquare,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Bell,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import { useDashboardAlerts } from "../hooks/useDashboardAlerts";

import AnalyticsTab from "../components/admin/AnalyticsTab";
import ProductsList from "../components/admin/ProductsList";
import OrdersTab from "../components/admin/OrdersTab";
import MarketingTab from "../components/admin/MarketingTab";
import EmailTab from "../components/admin/EmailTab";
import UsersTab from "../components/admin/UsersTab";
import AITab from "../components/admin/AITab";
import InventoryTab from "../components/admin/InventoryTab";
import StoreSettingsTab from "../components/admin/StoreSettingsTab";
import CouponsTab from "../components/admin/CouponsTab";
import ReviewsTab from "../components/admin/ReviewsTab";
import CatalogTab from "../components/admin/CatalogTab";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
  {
    id: "analytics",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
  },
  {
    id: "orders",
    label: "Đơn hàng",
    icon: ShoppingBasket,
    roles: ["admin", "staff"],
  },
  { id: "catalog", label: "Danh mục", icon: Layers, roles: ["admin", "staff"] },
  {
    id: "products",
    label: "Sản phẩm",
    icon: PlusCircle,
    roles: ["admin", "staff"],
  },
  {
    id: "inventory",
    label: "Kho hàng",
    icon: Archive,
    roles: ["admin", "staff"],
  },
  { id: "users", label: "Người dùng", icon: Users, roles: ["admin"] },
  { id: "ai", label: "AI System", icon: ShieldCheck, roles: ["admin"] },
  {
    id: "settings",
    label: "Giao diện",
    icon: LayoutTemplate,
    roles: ["admin"],
  },
  {
    id: "marketing_group",
    label: "Marketing",
    icon: Megaphone,
    roles: ["admin", "staff"],
    subItems: [
      { id: "email", label: "Email", icon: Mail, roles: ["admin", "staff"] },
      {
        id: "reviews",
        label: "Reviews & Q&A",
        icon: MessageSquare,
        roles: ["admin", "staff"],
      },
      { id: "coupons", label: "Mã giảm giá", icon: Tag, roles: ["admin"] },
    ],
  },
];

const resolveTabFromParams = (searchParams, accessibleTabs) => {
  const tabParam = searchParams.get("tab");
  let allIds = [];
  accessibleTabs.forEach((t) => {
    if (t.id) allIds.push(t.id);
    if (t.subItems) t.subItems.forEach((s) => allIds.push(s.id));
  });
  const ids = new Set(allIds);
  return ids.has(tabParam) ? tabParam : accessibleTabs[0]?.id || "analytics";
};

const AdminPage = () => {
  const { user } = useUserStore();
  const currentRole = user?.role || "admin";
  const accessibleTabs = useMemo(() => {
    return tabs
      .filter((t) => t.roles.includes(currentRole))
      .map((t) => {
        if (t.subItems) {
          return {
            ...t,
            subItems: t.subItems.filter((s) => s.roles.includes(currentRole)),
          };
        }
        return t;
      });
  }, [currentRole]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(
    () => resolveTabFromParams(searchParams, accessibleTabs),
    [searchParams, accessibleTabs],
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dashboard alerts & notifications — extracted to useDashboardAlerts hook
  const {
    tasks,
    notifications,
    notifCount,
    notifOpen,
    setNotifOpen,
    markAllRead,
  } = useDashboardAlerts();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    products: [],
    orders: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ products: [], orders: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [prodRes, ordersRes] = await Promise.allSettled([
          axios.get(
            `/products?search=${encodeURIComponent(searchQuery)}&limit=5`,
          ),
          axios.get(
            `/orders?search=${encodeURIComponent(searchQuery)}&limit=5`,
          ),
        ]);
        setSearchResults({
          products:
            prodRes.status === "fulfilled"
              ? prodRes.value.data?.products || []
              : [],
          orders:
            ordersRes.status === "fulfilled"
              ? ordersRes.value.data?.orders || []
              : [],
        });
      } catch {
        /* silent */
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (tabId) => {
    console.log("AdminPage handleTabChange - tabId:", tabId);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabId);
    setSearchParams(next, { replace: true });
    setSidebarOpen(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsTab />;
      case "orders":
        return <OrdersTab />;
      case "catalog":
        return <CatalogTab />;
      case "products":
        return (
          <div className="space-y-4">
            <ProductsList />
          </div>
        );
      case "inventory":
        return <InventoryTab />;
      case "marketing":
        return <MarketingTab />;
      case "email":
        return <EmailTab />;
      case "reviews":
        return <ReviewsTab />;
      case "coupons":
        return <CouponsTab />;
      case "users":
        return <UsersTab />;
      case "ai":
        return <AITab />;
      case "settings":
        return <StoreSettingsTab />;
      default:
        return null;
    }
  };

  const totalAlerts = tasks.pendingOrders + tasks.lowStock;

  const [expandedGroups, setExpandedGroups] = useState({
    marketing_group: true,
  });

  const toggleGroup = (groupId) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setExpandedGroups((prev) => ({ ...prev, [groupId]: true }));
    } else {
      setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    }
  };

  const renderSidebarNav = () => (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto admin-scroll overflow-x-hidden">
      {accessibleTabs.map((tab) => {
        if (tab.subItems) {
          const isExpanded = expandedGroups[tab.id];
          const hasActiveChild = tab.subItems.some((s) => s.id === activeTab);

          return (
            <div key={tab.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(tab.id)}
                className={`admin-sidebar-link group relative w-full transition-all duration-300 ease-in-out ${hasActiveChild && !isExpanded ? "active" : ""} ${isSidebarCollapsed ? "!px-3 !justify-center" : "text-left justify-between"}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`truncate transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden hidden" : "w-auto opacity-100"}`}
                  >
                    {tab.label}
                  </span>
                </div>
                {!isSidebarCollapsed &&
                  (isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  ))}

                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 delay-200 z-50 whitespace-nowrap shadow-lg">
                    {tab.label}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isExpanded && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pl-6 space-y-1 overflow-hidden"
                  >
                    {tab.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleTabChange(subItem.id)}
                        className={`admin-sidebar-link group relative w-full transition-all duration-300 ease-in-out ${activeTab === subItem.id ? "active" : ""} text-left text-sm`}
                      >
                        <subItem.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`admin-sidebar-link group relative w-full transition-all duration-300 ease-in-out ${activeTab === tab.id ? "active" : ""} ${isSidebarCollapsed ? "!px-3 !justify-center" : "text-left"}`}
          >
            <tab.icon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`truncate transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden hidden" : "w-auto opacity-100"}`}
            >
              {tab.label}
            </span>

            {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 delay-200 z-50 whitespace-nowrap shadow-lg flex items-center gap-2">
                {tab.label}
                {tab.id === "orders" && tasks.pendingOrders > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {tasks.pendingOrders > 9 ? "9+" : tasks.pendingOrders}
                  </span>
                )}
                {tab.id === "inventory" && tasks.lowStock > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {tasks.lowStock > 9 ? "9+" : tasks.lowStock}
                  </span>
                )}
              </div>
            )}

            {/* Badges for expanded state */}
            {tab.id === "orders" &&
              tasks.pendingOrders > 0 &&
              !isSidebarCollapsed && (
                <span className="ml-auto min-w-[20px] h-[20px] px-1 bg-amber-500 text-xs font-bold text-white rounded-full flex items-center justify-center flex-shrink-0">
                  {tasks.pendingOrders > 9 ? "9+" : tasks.pendingOrders}
                </span>
              )}
            {tab.id === "inventory" &&
              tasks.lowStock > 0 &&
              !isSidebarCollapsed && (
                <span className="ml-auto min-w-[20px] h-[20px] px-1 bg-red-500 text-xs font-bold text-white rounded-full flex items-center justify-center flex-shrink-0">
                  {tasks.lowStock}
                </span>
              )}

            {/* Dot indicators for collapsed state */}
            {tab.id === "orders" &&
              tasks.pendingOrders > 0 &&
              isSidebarCollapsed && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-luxury-darker"></span>
              )}
            {tab.id === "inventory" &&
              tasks.lowStock > 0 &&
              isSidebarCollapsed && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-luxury-darker"></span>
              )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      className="flex bg-gray-50 dark:bg-luxury-dark font-sans"
      style={{ "--font-display": "var(--font-sans)", zoom: "80%", minHeight: "125vh" }}
    >
      {/* ── Desktop Sidebar — Dense ──────────── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border sticky top-0 left-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-[4.5rem]" : "w-[240px]"}`}
        style={{ height: "125vh" }}
      >
        <div className="h-[72px] border-b border-gray-100 dark:border-luxury-border px-4 flex items-center justify-between">
          <a
            href="/"
            className={`flex items-center gap-3 transition-all duration-300 overflow-hidden hover:opacity-80 ${isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap">
              Trang Chủ
            </span>
          </a>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors flex-shrink-0"
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {renderSidebarNav()}

        {/* Toggle Collapse Button */}
        <div
          className={`border-t border-gray-100 dark:border-luxury-border p-3 flex ${isSidebarCollapsed ? "justify-center" : "justify-end"}`}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-luxury-border transition-colors"
            title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay sidebar ──────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border md:hidden"
            >
              <div className="h-[72px] flex items-center justify-between border-b border-gray-100 dark:border-luxury-border px-3">
                <a
                  href="/"
                  className={`admin-sidebar-link group relative w-full transition-all duration-300 ease-in-out text-gray-900 dark:text-white hover:text-luxury-gold hover:bg-gray-50 dark:hover:bg-luxury-border/50 text-left`}
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Trang chủ</span>
                </a>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 ml-2 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarNav()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar — compact */}
        <header className="sticky top-0 z-30 bg-white dark:bg-luxury-darker border-b border-gray-100 dark:border-luxury-border px-4 py-3 flex items-center justify-between md:hidden admin-topbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md text-gray-500 hover:text-luxury-gold hover:bg-gray-100 dark:hover:bg-luxury-border transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        {/* Desktop topbar — compact */}
        <header className="hidden md:flex h-[72px] items-center border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker sticky top-0 z-30">
          <div className="w-full px-4 md:px-8 flex items-center justify-between gap-6">
            {/* Global Search */}
            <div
              className="relative flex-1 max-w-lg"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget))
                  setSearchOpen(false);
              }}
              tabIndex={-1}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm nhanh sản phẩm, đơn hàng ..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg focus:outline-none focus:border-luxury-gold transition placeholder-gray-400 text-gray-900 dark:text-white"
              />
              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto admin-scroll">
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      Đang tìm kiếm...
                    </div>
                  )}
                  {searchResults.products.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">
                        Sản phẩm
                      </p>
                      {searchResults.products.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            handleTabChange("products");
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                        >
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-luxury-gold">
                              {p.price?.toLocaleString("vi-VN")} ₫
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.orders.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">
                        Đơn hàng
                      </p>
                      {searchResults.orders.map((o) => (
                        <button
                          key={o._id}
                          onClick={() => {
                            handleTabChange("orders");
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                        >
                          <ShoppingBasket className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              #{o.orderCode || o._id?.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {o.shippingDetails?.fullName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searchLoading &&
                    !searchResults.products.length &&
                    !searchResults.orders.length && (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        Không tìm thấy kết quả
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div
              className="relative flex-shrink-0"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget))
                  setNotifOpen(false);
              }}
              tabIndex={-1}
            >
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2.5 rounded-lg bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border text-gray-500 hover:text-luxury-gold hover:border-luxury-gold/30 transition"
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-luxury-border flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Thông báo
                    </p>
                    {notifCount > 0 && (
                      <span className="text-xs text-luxury-gold font-bold">
                        {notifCount} mới
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-luxury-border/30 admin-scroll">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-8">
                        Không có thông báo mới{" "}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            handleTabChange(n.tab);
                            setNotifOpen(false);
                            setNotifCount(0);
                          }}
                          className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.type === "order" ? "bg-amber-400" : "bg-red-400"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {n.desc}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-luxury-border">
                      <button
                        onClick={markAllRead}
                        className="text-xs text-gray-400 hover:text-luxury-gold transition"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab content — compact */}
        <main className="flex-1 overflow-auto admin-main bg-gray-50 dark:bg-luxury-dark">
          <div className="w-full px-4 md:px-8 py-4 md:py-6 space-y-5">
            {/* Today's Tasks — compact, analytics tab only */}
            {activeTab === "analytics" &&
              (tasks.pendingOrders > 0 || tasks.lowStock > 0) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Đơn chờ xử lý",
                      count: tasks.pendingOrders,
                      icon: Clock,
                      color:
                        "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",
                      tab: "orders",
                    },
                    {
                      label: "Hàng sắp hết",
                      count: tasks.lowStock,
                      icon: AlertTriangle,
                      color:
                        "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",
                      tab: "inventory",
                    },
                    {
                      label: "Review chờ duyệt",
                      count: tasks.pendingReviews,
                      icon: MessageSquare,
                      color:
                        "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",
                      tab: "reviews",
                    },
                    {
                      label: "Câu hỏi chưa trả lời",
                      count: tasks.unansweredQuestions,
                      icon: CheckCircle,
                      color:
                        "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",
                      tab: "reviews",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleTabChange(item.tab)}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${item.color} hover:scale-[1.01] transition-transform text-left w-full`}
                    >
                      <item.icon className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <p className="text-xl font-bold leading-none">
                          {item.count}
                        </p>
                        <p className="text-xs font-medium opacity-80 mt-1 leading-tight">
                          {item.label}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-luxury-darker/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm dark:shadow-none p-6 md:p-8 min-h-[500px]"
            >
              {renderTab()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
