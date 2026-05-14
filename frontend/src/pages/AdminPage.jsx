import {
  PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail,
  Megaphone, ShieldCheck, Archive, Menu, X, Watch, LayoutTemplate, Tag, MessageSquare, Layers,
  AlertTriangle, Clock, CheckCircle, Search, Bell, ChevronDown, Settings
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

import AnalyticsTab from "../components/AnalyticsTab";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import MarketingTab from "../components/MarketingTab";
import EmailTab from "../components/EmailTab";
import UsersTab from "../components/UsersTab";
import AITab from "../components/AITab";
import InventoryTab from "../components/InventoryTab";
import StoreSettingsTab from "../components/StoreSettingsTab";
import CouponsTab from "../components/CouponsTab";
import ReviewsTab from "../components/ReviewsTab";
import CatalogTab from "../components/CatalogTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
  { id: "analytics", label: "Dashboard",     icon: LayoutDashboard, roles: ["admin", "staff"] },
  { id: "orders",    label: "ÄÆ¡n hĂ ng",      icon: ShoppingBasket,  roles: ["admin", "staff"] },
  { id: "catalog",   label: "Danh má»¥c",       icon: Layers,          roles: ["admin", "staff"] },
  { id: "products",  label: "Sáº£n pháº©m",      icon: PlusCircle,      roles: ["admin", "staff"] },
  { id: "inventory", label: "Kho hĂ ng",      icon: Archive,         roles: ["admin", "staff"] },
  { id: "marketing", label: "Marketing",     icon: Megaphone,       roles: ["admin", "staff"] },
  { id: "email",     label: "Email",         icon: Mail,            roles: ["admin", "staff"] },
  { id: "reviews",   label: "Reviews & Q&A", icon: MessageSquare,   roles: ["admin", "staff"] },
  { id: "coupons",   label: "MĂ£ giáº£m giĂ¡",   icon: Tag,             roles: ["admin"] },
  { id: "users",     label: "NgÆ°á»i dĂ¹ng",    icon: Users,           roles: ["admin"] },
  { id: "ai",        label: "AI System",     icon: ShieldCheck,     roles: ["admin"] },
  { id: "settings",  label: "Giao diá»‡n",     icon: LayoutTemplate,  roles: ["admin"] },
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
  const [activeTab, setActiveTab] = useState(() => resolveTabFromParams(searchParams, accessibleTabs));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState({ pendingOrders: 0, lowStock: 0, pendingReviews: 0, unansweredQuestions: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const notifFetchRef = useRef({ promise: null, lastFetched: 0 });

  const fetchDashboardAlerts = useCallback(async () => {
    const now = Date.now();
    const fs = notifFetchRef.current;
    if (fs.promise) return fs.promise;
    if (now - fs.lastFetched < 15000) return;
    fs.promise = Promise.allSettled([
      axios.get("/orders?status=pending&limit=5"),
      axios.get("/products/inventory/alerts?limit=3"),
      axios.get("/reviews?status=pending&limit=1"),
      axios.get("/questions?answered=false&limit=1"),
    ]).then(([ordersRes, inventoryRes, reviewsRes, questionsRes]) => {
      setTasks({
        pendingOrders: ordersRes.status === "fulfilled" ? (ordersRes.value.data?.pagination?.totalOrders || 0) : 0,
        lowStock: inventoryRes.status === "fulfilled" ? (inventoryRes.value.data?.totalAlerts || 0) : 0,
        pendingReviews: reviewsRes.status === "fulfilled" ? (reviewsRes.value.data?.pagination?.totalReviews || 0) : 0,
        unansweredQuestions: questionsRes.status === "fulfilled" ? (questionsRes.value.data?.totalQuestions || 0) : 0,
      });
      const notifs = [];
      if (ordersRes.status === "fulfilled") {
        (ordersRes.value.data?.orders || []).slice(0, 5).forEach(o => notifs.push({
          id: o._id, type: "order",
          title: "ÄÆ¡n hĂ ng má»›i chá» xá»­ lĂ½",
          desc: "#" + (o.orderCode || o._id?.slice(0, 8).toUpperCase()) + " â€” " + (o.shippingDetails?.fullName || ""),
          time: o.createdAt, tab: "orders",
        }));
      }
      if (inventoryRes.status === "fulfilled") {
        (inventoryRes.value.data?.products || []).slice(0, 3).forEach(p => notifs.push({
          id: "inv_" + p._id, type: "inventory",
          title: "HĂ ng sáº¯p háº¿t kho",
          desc: (p.name || "Sáº£n pháº©m") + " â€” cĂ²n " + p.stock + " cĂ¡i",
          time: new Date().toISOString(), tab: "inventory",
        }));
      }
      setNotifications(notifs);
      setNotifCount(notifs.length);
    }).finally(() => {
      fs.lastFetched = Date.now();
      fs.promise = null;
    });
    return fs.promise;
  }, []);

  useEffect(() => {
    fetchDashboardAlerts();
    const interval = setInterval(fetchDashboardAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardAlerts]);

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

  useEffect(() => {
    const tabFromUrl = resolveTabFromParams(searchParams, accessibleTabs);
    if (tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
    const ids = new Set(accessibleTabs.map(t => t.id));
    if (!searchParams.get("tab") || !ids.has(searchParams.get("tab"))) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", tabFromUrl);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, activeTab, accessibleTabs]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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

      {/* â”€â”€ Desktop Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border min-h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-luxury-border">
          <div className="w-7 h-7 rounded-lg bg-luxury-gold flex items-center justify-center flex-shrink-0">
            <Watch className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Watch Admin</p>
            <p className="text-[10px] text-gray-400 truncate capitalize">{currentRole}</p>
          </div>
        </div>

        <SidebarNav />

        <div className="px-4 py-3 border-t border-gray-100 dark:border-luxury-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-luxury-gold/20 flex items-center justify-center text-[11px] font-bold text-luxury-gold flex-shrink-0">
              {user?.name?.substring(0, 2)?.toUpperCase() || "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* â”€â”€ Mobile overlay sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              className="fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border md:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-luxury-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-luxury-gold flex items-center justify-center">
                    <Watch className="w-3.5 h-3.5 text-black" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Watch Admin</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarNav />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* â”€â”€ Main Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-luxury-darker border-b border-gray-100 dark:border-luxury-border px-4 py-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-luxury-gold hover:bg-gray-100 dark:hover:bg-luxury-border transition">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-luxury-gold truncate max-w-[120px]">
              {accessibleTabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => setNotifOpen(o => !o)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-luxury-border transition-colors relative">
              <Bell className="w-4 h-4" />
              {notifCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker sticky top-0 z-30 gap-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
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
                    <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">Sáº£n pháº©m</p>
                    {searchResults.products.map(p => (
                      <button key={p._id} onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set("tab", "products");
                          next.set("focus", p._id);
                          setSearchParams(next, { replace: true });
                          setSearchOpen(false); setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
                        {p.image && <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover" />}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-luxury-gold">{p.price?.toLocaleString("vi-VN")} â‚«</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.orders.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">ÄÆ¡n hĂ ng</p>
                    {searchResults.orders.map(o => (
                      <button key={o._id} onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set("tab", "orders");
                          next.set("focus", o._id);
                          setSearchParams(next, { replace: true });
                          setSearchOpen(false); setSearchQuery("");
                        }}
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
                  {notifCount > 0 && <span className="text-[10px] text-red-400 font-bold">{notifCount} mới</span>}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-luxury-border/30 admin-scroll">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">Không có thông báo mới</p>
                  ) : notifications.map(n => (
                    <button key={n.id} onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("tab", n.tab);
                        next.set("focus", n.id);
                        setSearchParams(next, { replace: true });
                        setNotifOpen(false);
                        setNotifCount(0);
                      }}
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
                    <button onClick={async () => {
                        try {
                          await axios.post('/notifications/mark-all-read');
                          setNotifications([]);
                          setNotifCount(0);
                          setNotifOpen(false);
                          toast.success('Đã đánh dấu tất cả đã đọc');
                        } catch (e) {
                          if (e?.response?.status === 404) {
                            toast.error('Tính năng chưa được bật trên backend');
                          } else {
                            toast.error('Lỗi khi đánh dấu thông báo');
                          }
                        }
                      }}
                      className="text-[10px] text-gray-400 hover:text-luxury-gold transition">
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto space-y-5">
          {/* Today's Tasks â€” analytics tab only */}
          {activeTab === "analytics" && (tasks.pendingOrders > 0 || tasks.lowStock > 0) && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "ÄÆ¡n chá» xá»­ lĂ½",       count: tasks.pendingOrders,        icon: Clock,         color: "text-amber-400 bg-amber-400/10 border-amber-400/20", tab: "orders" },
                { label: "HĂ ng sáº¯p háº¿t",          count: tasks.lowStock,             icon: AlertTriangle, color: "text-red-400 bg-red-400/10 border-red-400/20",       tab: "inventory" },
                { label: "Review chá» duyá»‡t",      count: tasks.pendingReviews,       icon: MessageSquare, color: "text-blue-400 bg-blue-400/10 border-blue-400/20",     tab: "reviews" },
                { label: "CĂ¢u há»i chÆ°a tráº£ lá»i", count: tasks.unansweredQuestions,  icon: CheckCircle,   color: "text-purple-400 bg-purple-400/10 border-purple-400/20", tab: "reviews" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleTabChange(item.tab)}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${item.color} hover:scale-[1.02] transition-transform text-left w-full`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold leading-none">{item.count}</p>
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

