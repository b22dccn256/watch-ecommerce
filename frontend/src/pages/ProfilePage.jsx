import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Package,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useUserStore } from "../stores/useUserStore";
import { useOrderStore } from "../stores/useOrderStore";
import { SkeletonPageShell } from "../components/SkeletonLoaders";
import Input from "../components/ui/Input";

const tabs = [
  { id: "profile", label: "Thông tin", icon: UserIcon },
  { id: "orders", label: "Đơn hàng", icon: ShoppingBag },
  { id: "password", label: "Mật khẩu", icon: Lock },
];

const ProfilePage = () => {
  const { user, loading: userLoading, logout, updateProfile, changePassword } = useUserStore();
  const { orders, loading: ordersLoading, fetchMyOrders, cancelOrder, requestReturnOrder } = useOrderStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});

  const [profileData, setProfileData] = useState({ name: "", phone: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ old: false, next: false, confirm: false });

  useEffect(() => {
    if (!user) return;

    setProfileData({
      name: user.name || "",
      phone: user.phone || "",
    });

    fetchMyOrders();
  }, [fetchMyOrders, user]);

  const sortedOrders = useMemo(
    () => [...(orders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  const validateProfile = () => {
    const nextErrors = {};
    if (!profileData.name.trim()) nextErrors.name = "Tên không được để trống";
    if (profileData.phone && !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(profileData.phone.replace(/\s/g, ""))) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }
    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;
    await updateProfile(profileData);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const success = await changePassword(passwordData);
    if (!success) return;

    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  const statusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "confirmed":
        return "Đã xác nhận";
      case "shipping":
        return "Đang giao";
      case "return_requested":
        return "Chờ duyệt trả hàng";
      case "delivered":
      case "completed":
        return "Hoàn thành";
      case "returned":
        return "Đã trả hàng";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const statusDotClass = (status) => {
    if (["delivered", "completed"].includes(status)) return "bg-[color:var(--color-gold)]";
    if (status === "shipping") return "bg-gray-500";
    if (["pending", "confirmed", "cancelled", "return_requested", "returned"].includes(status)) return "bg-gray-400";
    return "bg-gray-400";
  };

  if (userLoading && !user) {
    return <SkeletonPageShell rows={5} />;
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--color-gold)]/30 bg-[color:var(--color-gold)]/10">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-6 w-6 text-[color:var(--color-gold)]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-primary">{user?.name || "Khách hàng"}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
                </p>
              </div>
            </div>

            {typeof user?.rewardPoints === "number" && (
              <div className="rounded-xl bg-surface-soft p-3 text-sm">
                <p className="text-muted">Điểm thưởng</p>
                <p className="mt-1 text-xl font-bold text-[color:var(--color-gold)]">{user.rewardPoints.toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>

          <nav className="rounded-[1.4rem] border border-black/10 bg-surface p-2 shadow-sm dark:border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${active ? "bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]" : "text-secondary hover:bg-surface-soft"}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-secondary transition hover:bg-[color:var(--color-gold)]/10 hover:text-[color:var(--color-gold)]"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </nav>
        </aside>

        <section className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === "profile" && (
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <h1 className="hero-title text-3xl">Thông tin cá nhân</h1>
                    <p className="mt-1 text-sm text-secondary">Quản lý thông tin liên hệ và hồ sơ tài khoản.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Họ và tên"
                      name="name"
                      value={profileData.name}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, name: event.target.value }))}
                      error={profileErrors.name}
                    />
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      value={profileData.phone}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, phone: event.target.value }))}
                      error={profileErrors.phone}
                      placeholder="0912345678"
                    />
                    <Input
                      label="Email"
                      value={user?.email || ""}
                      disabled
                      hint="Email không thể chỉnh sửa"
                      containerClassName="sm:col-span-2"
                    />
                  </div>

                  <button type="submit" disabled={userLoading} className="btn-base btn-primary h-11 px-6">
                    {userLoading ? "Đang xử lý" : "Lưu thay đổi"}
                  </button>
                </form>
              )}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="hero-title text-3xl">Đơn hàng của tôi</h1>
                    <p className="mt-1 text-sm text-secondary">Theo dõi trạng thái và quản lý các đơn đã đặt.</p>
                  </div>

                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-soft" />
                      ))}
                    </div>
                  ) : sortedOrders.length === 0 ? (
                    <div className="rounded-xl border border-black/10 bg-surface-soft p-10 text-center dark:border-white/10">
                      <Package className="mx-auto mb-3 h-10 w-10 text-muted" />
                      <p className="text-secondary">Bạn chưa có đơn hàng nào.</p>
                      <Link to="/catalog" className="btn-base btn-outline mt-4 h-10 px-5">
                        Mua sắm ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedOrders.map((order) => (
                        <button
                          key={order._id}
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="w-full rounded-xl border border-black/10 bg-surface-soft p-4 text-left transition hover:border-[color:var(--color-gold)]/40 dark:border-white/10"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-primary">#{order.orderCode || order._id.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("vi-VN")} • {order.products?.length || 0} sản phẩm</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[color:var(--color-gold)]">{order.totalAmount?.toLocaleString("vi-VN")} đ</p>
                              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-secondary">
                                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${statusDotClass(order.status)}`} />
                                {statusText(order.status)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "password" && (
                <form onSubmit={handlePasswordSubmit} className="max-w-lg space-y-4">
                  <div>
                    <h1 className="hero-title text-3xl">Đổi mật khẩu</h1>
                    <p className="mt-1 text-sm text-secondary">Cập nhật mật khẩu để tăng cường bảo mật tài khoản.</p>
                  </div>

                  {[
                    ["oldPassword", "Mật khẩu hiện tại", "old"],
                    ["newPassword", "Mật khẩu mới", "next"],
                    ["confirmPassword", "Xác nhận mật khẩu", "confirm"],
                  ].map(([field, label, flag]) => (
                    <div key={field} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">{label}</p>
                      <div className="relative">
                        <input
                          type={showPassword[flag] ? "text" : "password"}
                          value={passwordData[field]}
                          onChange={(event) => setPasswordData((prev) => ({ ...prev, [field]: event.target.value }))}
                          className="input-base pr-11"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, [flag]: !prev[flag] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition hover:text-primary"
                        >
                          {showPassword[flag] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="submit" disabled={userLoading} className="btn-base btn-primary h-11 px-6">
                    {userLoading ? "Đang cập nhật" : "Cập nhật mật khẩu"}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.3rem] border border-black/10 bg-surface p-6 dark:border-white/10 sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="hero-title text-3xl">Đơn #{selectedOrder.orderCode || selectedOrder._id.slice(-6).toUpperCase()}</h2>
                  <p className="mt-1 text-sm text-secondary">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                  <span className={`inline-flex h-1.5 w-1.5 rounded-full ${statusDotClass(selectedOrder.status)}`} />
                  {statusText(selectedOrder.status)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-soft p-4 text-sm">
                  <p className="font-semibold text-primary">Thông tin giao hàng</p>
                  <p className="mt-2 text-secondary">{selectedOrder.shippingDetails?.fullName}</p>
                  <p className="text-secondary">{selectedOrder.shippingDetails?.phoneNumber}</p>
                  <p className="text-secondary">{selectedOrder.shippingDetails?.address}</p>
                </div>
                <div className="rounded-xl bg-surface-soft p-4 text-sm">
                  <p className="font-semibold text-primary">Thanh toán</p>
                  <p className="mt-2 text-secondary">Phương thức: {selectedOrder.paymentMethod?.toUpperCase()}</p>
                  <p className="text-secondary">Trạng thái: {selectedOrder.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</p>
                  <p className="mt-1 font-semibold text-[color:var(--color-gold)]">{selectedOrder.totalAmount?.toLocaleString("vi-VN")} đ</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {selectedOrder.products?.map((item, index) => (
                  <div key={`${item.product?._id || index}-${index}`} className="flex items-center gap-3 rounded-xl border border-black/10 bg-surface-soft p-3 text-sm dark:border-white/10">
                    <img src={item.product?.image} alt={item.product?.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{item.product?.name}</p>
                      <p className="text-xs text-muted">x{item.quantity}</p>
                    </div>
                    <p className="font-semibold text-primary">{item.price?.toLocaleString("vi-VN")} đ</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedOrder.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => cancelOrder(selectedOrder._id)}
                    className="btn-base btn-outline h-10 px-5 text-secondary hover:text-[color:var(--color-gold)]"
                  >
                    Hủy đơn hàng
                  </button>
                )}

                {selectedOrder.status === "delivered" && (
                  <button
                    type="button"
                    onClick={() => requestReturnOrder(selectedOrder._id)}
                    className="btn-base btn-outline h-10 px-5"
                  >
                    Yêu cầu trả hàng
                  </button>
                )}

                {selectedOrder.trackingToken && (
                  <Link to={`/order-tracking/${selectedOrder.trackingToken}`} className="btn-base btn-secondary h-10 px-5">
                    Theo dõi đơn
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {Object.keys(profileErrors).length > 0 && activeTab === "profile" && (
        <div className="fixed bottom-4 right-4 rounded-xl border border-black/15 bg-white/95 px-4 py-2 text-sm text-secondary shadow-lg dark:border-white/15 dark:bg-black/75 dark:text-gray-200">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[color:var(--color-gold)]" />
            Vui lòng kiểm tra thông tin hồ sơ.
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
