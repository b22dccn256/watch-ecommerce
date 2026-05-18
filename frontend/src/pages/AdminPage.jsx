import {
  PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail,
  Megaphone, ShieldCheck, Archive, Menu, X, Watch, LayoutTemplate, Tag, MessageSquare, Layers,
  AlertTriangle, Clock, CheckCircle, Search, Bell, Settings
} from "lucide-react";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
  { id: "analytics", label: "Dashboard",     icon: LayoutDashboard, roles: ["admin", "staff"] },
  { id: "orders",    label: "Đơn hàng",      icon: ShoppingBasket,  roles: ["admin", "staff"] },
  { id: "catalog",   label: "Danh mục",       icon: Layers,          roles: ["admin", "staff"] },
  { id: "products",  label: "Sản phẩm",      icon: PlusCircle,      roles: ["admin", "staff"] },
  { id: "inventory", label: "Kho hàng",      icon: Archive,         roles: ["admin", "staff"] },
  { id: "marketing", label: "Marketing",     icon: Megaphone,       roles: ["admin", "staff"] },
  { id: "email",     label: "Email",         icon: Mail,            roles: ["admin", "staff"] },
  { id: "reviews",   label: "Reviews & Q&A", icon: MessageSquare,   roles: ["admin", "staff"] },
  { id: "coupons",   label: "Mã giảm giá",   icon: Tag,             roles: ["admin"] },
  { id: "users",     label: "Người dùng",    icon: Users,           roles: ["admin"] },
  { id: "ai",        label: "AI System",     icon: ShieldCheck,     roles: ["admin"] },
  { id: "settings",  label: "Giao diện",     icon: LayoutTemplate,  roles: ["admin"] },
];

const resolveTabFromParams = (searchParams, accessibleTabs) => {
  const tabParam = searchParams.get("tab");
  const ids = new Set(accessibleTabs.map(t => t.id));
  return ids.has(tabParam) ? tabParam : accessibleTabs[0]?.id || "analytics";
};

const AdminPage = () => {
  const { user } = useUserStore();
  const currentRole = user?.role || "admin";
  const accessibleTabs = useMemo(() => tabs.filter(t => t.roles.includes(currentRole)), [currentRole]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => resolveTabFromParams(searchParams, accessibleTabs), [searchParams, accessibleTabs]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard alerts & notifications — extracted to useDashboardAlerts hook
  const { tasks, notifications, notifCount, notifOpen, setNotifOpen, markAllRead } = useDashboardAlerts();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
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
          axios.get(`/products?search=${encodeURIComponent(searchQuery)}&limit=5`),
          axios.get(`/orders?search=${encodeURIComponent(searchQuery)}&limit=5`),
        ]);
        setSearchResults({
          products: prodRes.status === "fulfilled" ? (prodRes.value.data?.products || []) : [],
          orders: ordersRes.status === "fulfilled" ? (ordersRes.value.data?.orders || []) : [],
        });
      } catch { /* silent */ } finally {
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
      case "analytics":  return <AnalyticsTab />;
      case "orders":     return <OrdersTab />;
      case "catalog":    return <CatalogTab />;
      case "products":   return <div className="space-y-4"><ProductsList /></div>;
      case "inventory":  return <InventoryTab />;
      case "marketing":  return <MarketingTab />;
      case "email":      return <EmailTab />;
      case "reviews":    return <ReviewsTab />;
      case "coupons":    return <CouponsTab />;
      case "users":      return <UsersTab />;
      case "ai":         return <AITab />;
      case "settings":   return <StoreSettingsTab />;
      default:           return null;
    }
  };

  const totalAlerts = tasks.pendingOrders + tasks.lowStock;

  const SidebarNav = () => (
    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto admin-scroll">
      {accessibleTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`admin-sidebar-link w-full text-left ${activeTab === tab.id ? "active" : ""}`}
        >
          <tab.icon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{tab.label}</span>
          {tab.id === "orders" && tasks.pendingOrders > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-amber-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center flex-shrink-0">
              {tasks.pendingOrders > 9 ? "9+" : tasks.pendingOrders}
            </span>
          )}
          {tab.id === "inventory" && tasks.lowStock > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center flex-shrink-0">
              {tasks.lowStock}
            </span>
          )}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-luxury-dark">

      {/* ── Desktop Sidebar — Dense ──────────── */}
      <aside className="hidden md:flex flex-col w-48 flex-shrink-0 bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border min-h-screen sticky top-0">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 dark:border-luxury-border">
          <div className="w-6 h-6 rounded-md bg-luxury-gold flex items-center justify-center flex-shrink-0">
            <Watch className="w-3 h-3 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">Watch Admin</p>
            <p className="text-[9px] text-gray-400 truncate capitalize">{currentRole}</p>
          </div>
        </div>

        <SidebarNav />

        <div className="px-3 py-2.5 border-t border-gray-100 dark:border-luxury-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-luxury-gold/20 flex items-center justify-center text-[10px] font-bold text-luxury-gold flex-shrink-0">
              {user?.name?.substring(0, 2)?.toUpperCase() || "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-gray-800 dark:text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[9px] text-gray-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile overlay sidebar ──────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-48 flex flex-col bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border md:hidden"
            >
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 dark:border-luxury-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-luxury-gold flex items-center justify-center">
                    <Watch className="w-3 h-3 text-black" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white">Watch Admin</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarNav />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar — compact */}
        <header className="sticky top-0 z-30 bg-white dark:bg-luxury-darker border-b border-gray-100 dark:border-luxury-border px-3 py-2 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 rounded-md text-gray-500 hover:text-luxury-gold hover:bg-gray-100 dark:hover:bg-luxury-border transition">
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-luxury-gold truncate max-w-[100px]">
              {accessibleTabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => setNotifOpen(o => !o)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors relative">
              <Bell className="w-4 h-4" />
              {notifCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>
        </header>

        {/* Desktop topbar — compact */}
        <header className="hidden md:flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker sticky top-0 z-30 gap-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {(() => {
              const t = accessibleTabs.find(t => t.id === activeTab);
              return t ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <t.icon className="w-4 h-4 text-luxury-gold" />
                  {t.label}
                </span>
              ) : null;
            })()}
          </motion.div>

          {/* Global Search */}
          <div
            className="relative flex-1 max-w-sm"
            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false); }}
            tabIndex={-1}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, đơn hàng..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg focus:outline-none focus:border-luxury-gold transition placeholder-gray-400 text-gray-900 dark:text-white"
            />
            {searchOpen && searchQuery.trim() && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto admin-scroll">
                {searchLoading && <div className="px-4 py-3 text-xs text-gray-400">Đang tìm kiếm...</div>}
                {searchResults.products.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">Sản phẩm</p>
                    {searchResults.products.map(p => (
                      <button key={p._id} onClick={() => { handleTabChange("products"); setSearchOpen(false); setSearchQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
                        {p.image && <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover" />}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-luxury-gold">{p.price?.toLocaleString("vi-VN")} ₫</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.orders.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">Đơn hàng</p>
                    {searchResults.orders.map(o => (
                      <button key={o._id} onClick={() => { handleTabChange("orders"); setSearchOpen(false); setSearchQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
                        <ShoppingBasket className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">#{o.orderCode || o._id?.slice(0, 8)}</p>
                          <p className="text-[10px] text-gray-500">{o.shippingDetails?.fullName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!searchLoading && !searchResults.products.length && !searchResults.orders.length && (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">Không tìm thấy kết quả</div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div
            className="relative flex-shrink-0"
            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setNotifOpen(false); }}
            tabIndex={-1}
          >
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative p-2 rounded-lg bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border text-gray-500 hover:text-luxury-gold hover:border-luxury-gold/30 transition"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-luxury-border flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Thông báo</p>
                  {notifCount > 0 && <span className="text-[10px] text-luxury-gold font-bold">{notifCount} mới</span>}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-luxury-border/30 admin-scroll">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">Không có thông báo mới 🎉</p>
                  ) : notifications.map(n => (
                    <button key={n.id} onClick={() => { handleTabChange(n.tab); setNotifOpen(false); setNotifCount(0); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${n.type === "order" ? "bg-amber-400" : "bg-red-400"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-luxury-border">
                    <button onClick={markAllRead}
                      className="text-[10px] text-gray-400 hover:text-luxury-gold transition">
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Tab content — compact */}
        <main className="flex-1 p-3 md:p-4 overflow-auto space-y-3">
          {/* Today's Tasks — compact, analytics tab only */}
          {activeTab === "analytics" && (tasks.pendingOrders > 0 || tasks.lowStock > 0) && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { label: "Đơn chờ xử lý",       count: tasks.pendingOrders,        icon: Clock,         color: "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20", tab: "orders" },
                { label: "Hàng sắp hết",          count: tasks.lowStock,             icon: AlertTriangle, color: "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",       tab: "inventory" },
                { label: "Review chờ duyệt",      count: tasks.pendingReviews,       icon: MessageSquare, color: "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20",     tab: "reviews" },
                { label: "Câu hỏi chưa trả lời", count: tasks.unansweredQuestions,  icon: CheckCircle,   color: "text-luxury-gold bg-luxury-gold/8 border-luxury-gold/20", tab: "reviews" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleTabChange(item.tab)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${item.color} hover:scale-[1.01] transition-transform text-left w-full`}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <p className="text-base font-bold leading-none">{item.count}</p>
                    <p className="text-[10px] font-medium opacity-80 mt-0.5 leading-tight">{item.label}</p>
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
            className="bg-white dark:bg-luxury-darker/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm dark:shadow-none p-5 md:p-6 min-h-[500px]"
          >
            {renderTab()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
