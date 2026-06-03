import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  Check,
  User as UserIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useUserStore } from "../stores/useUserStore";
import { useOrderStore } from "../stores/useOrderStore";
import { SkeletonPageShell } from "../components/SkeletonLoaders";
import Input from "../components/ui/Input";

const tabs = [
  { id: "profile", label: "Thông tin", icon: UserIcon },
  { id: "orders", label: "Đơn hàng", icon: ShoppingBag },
  { id: "password", label: "Mật khẩu", icon: Lock },
];

const createAddressDraft = (source = {}) => ({
  id: source.id || `addr-${Date.now()}`,
  label: source.label || "Địa chỉ mới",
  fullName: source.fullName || "",
  phone: source.phone || "",
  address: source.address || "",
  city: source.city || "",
  isDefault: Boolean(source.isDefault),
});

const normalizeAddressBook = (book = []) => {
  const list = (Array.isArray(book) ? book : [])
    .map((item) => {
      if (!item?.address || !item?.city) return null;
      return createAddressDraft(item);
    })
    .filter(Boolean)
    .slice(0, 5);

  if (list.length === 0) return [];
  const defaultIndex = list.findIndex((item) => item.isDefault);
  if (defaultIndex > 0) {
    const [defaultItem] = list.splice(defaultIndex, 1);
    list.unshift({ ...defaultItem, isDefault: true });
  }
  if (!list.some((item) => item.isDefault)) {
    list[0] = { ...list[0], isDefault: true };
  }
  return list;
};

const ProfilePage = () => {
  const {
    user,
    loading: userLoading,
    logout,
    updateProfile,
    changePassword,
  } = useUserStore();
  const {
    orders,
    loading: ordersLoading,
    fetchMyOrders,
    cancelOrder,
    requestReturnOrder,
  } = useOrderStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    ["profile", "orders", "password"].includes(tabParam) ? tabParam : "profile",
  );

  useEffect(() => {
    if (["profile", "orders", "password"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});

  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    address: "",
    gender: "",
    birthday: "",
  });
  const [addressBook, setAddressBook] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState("");
  const [addressDraft, setAddressDraft] = useState(createAddressDraft());
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    if (!user) return;

    const normalizedBook = normalizeAddressBook(user.addressBook || []);
    const fallbackAddress = user.address
      ? createAddressDraft({
          id: "legacy-default",
          label: "Địa chỉ mặc định",
          fullName: user.name || "",
          phone: user.phone || "",
          address: user.address || "",
          city: "",
          isDefault: true,
        })
      : null;

    setProfileData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      gender: user.gender || "",
      birthday: user.birthday
        ? new Date(user.birthday).toISOString().split("T")[0]
        : "",
    });

    if (normalizedBook.length > 0) {
      setAddressBook(normalizedBook);
      const primaryAddress =
        normalizedBook.find((item) => item.isDefault) || normalizedBook[0];
      setDefaultAddressId(primaryAddress.id);
      setAddressDraft(createAddressDraft(primaryAddress));
    } else if (fallbackAddress) {
      setAddressBook([fallbackAddress]);
      setDefaultAddressId(fallbackAddress.id);
      setAddressDraft(createAddressDraft(fallbackAddress));
    } else {
      setAddressBook([]);
      setDefaultAddressId("");
      setAddressDraft(createAddressDraft());
    }

    fetchMyOrders();
  }, [fetchMyOrders, user]);

  const sortedOrders = useMemo(
    () =>
      [...(orders || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ),
    [orders],
  );

  const validateProfile = () => {
    const nextErrors = {};
    if (!profileData.name.trim()) nextErrors.name = "Tên không được để trống";
    if (
      profileData.phone &&
      !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(profileData.phone.replace(/\s/g, ""))
    ) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }
    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;

    await updateProfile({
      name: profileData.name.trim(),
      phone: profileData.phone.trim(),
      address: profileData.address.trim(),
      gender: profileData.gender,
      birthday: profileData.birthday,
    });
  };

  const resetAddressDraft = () => {
    setAddressDraft({
      id: `addr-${Date.now()}`,
      label: "",
      fullName: "",
      phone: "",
      address: "",
      city: "",
      isDefault: false,
    });
    setIsEditingAddress(false);
  };

  const handleSaveAddressDraft = async () => {
    if (
      !addressDraft.label.trim() ||
      !addressDraft.address.trim() ||
      !addressDraft.city.trim()
    ) {
      setProfileErrors((prev) => ({
        ...prev,
        addressDraft: "Vui lòng nhập nhãn, địa chỉ và tỉnh/thành phố",
      }));
      return;
    }

    const nextAddress = createAddressDraft({
      ...addressDraft,
      isDefault: addressDraft.isDefault || addressBook.length === 0,
    });

    const nextBook = (() => {
      const filtered = addressBook.filter((item) => item.id !== nextAddress.id);
      if (nextAddress.isDefault) {
        return [
          { ...nextAddress, isDefault: true },
          ...filtered.map((item) => ({ ...item, isDefault: false })),
        ].slice(0, 5);
      }
      return [...filtered, nextAddress].slice(0, 5);
    })();

    const defaultItem = nextBook.find((item) => item.isDefault) || nextBook[0];

    // Save directly to backend
    await updateProfile({
      addressBook: nextBook,
      defaultAddressId: defaultItem?.id || "",
    });

    resetAddressDraft();
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.addressDraft;
      return next;
    });
  };

  const handleEditAddress = (address) => {
    setAddressDraft(createAddressDraft(address));
    setIsEditingAddress(true);
  };

  const handleDeleteAddress = async (id) => {
    const nextBook = addressBook.filter((item) => item.id !== id);
    const nextDefault =
      defaultAddressId === id ? nextBook[0]?.id || "" : defaultAddressId;

    if (nextBook.length > 0 && !nextBook.some((item) => item.isDefault)) {
      nextBook[0].isDefault = true;
    }
    const defaultItem = nextBook.find((item) => item.isDefault);

    await updateProfile({
      addressBook: nextBook,
      defaultAddressId: defaultItem?.id || nextDefault || "",
    });

    if (addressDraft.id === id) {
      resetAddressDraft();
    }
  };

  const handleSetDefaultAddress = async (id) => {
    const nextBook = addressBook.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    await updateProfile({
      addressBook: nextBook,
      defaultAddressId: id,
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const success = await changePassword(passwordData);
    if (!success) return;

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const statusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
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
    if (["delivered", "completed"].includes(status))
      return "bg-[color:var(--color-gold)]";
    if (status === "shipped") return "bg-gray-500";
    if (
      [
        "pending",
        "confirmed",
        "cancelled",
        "return_requested",
        "returned",
      ].includes(status)
    )
      return "bg-gray-400";
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
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-6 w-6 text-[color:var(--color-gold)]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-primary">
                  {user?.name || "Khách hàng"}
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
                </p>
              </div>
            </div>

            {typeof user?.rewardPoints === "number" && (
              <div className="rounded-xl bg-surface-soft p-3 text-sm">
                <p className="text-muted">Điểm thưởng</p>
                <p className="mt-1 text-xl font-bold text-[color:var(--color-gold)]">
                  {user.rewardPoints.toLocaleString("vi-VN")}
                </p>
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id });
                  }}
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
                    <p className="mt-1 text-sm text-secondary">
                      Quản lý thông tin liên hệ và hồ sơ tài khoản.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Họ và tên"
                      name="name"
                      value={profileData.name}
                      onChange={(event) =>
                        setProfileData((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      error={profileErrors.name}
                    />
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      value={profileData.phone}
                      onChange={(event) =>
                        setProfileData((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      error={profileErrors.phone}
                      placeholder="0912345678"
                    />
                    <Input
                      label="Địa chỉ"
                      name="address"
                      value={profileData.address}
                      onChange={(event) =>
                        setProfileData((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                      placeholder="Số nhà, đường, quận, thành phố"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        Giới tính
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                        className="input-base h-11 w-full rounded-lg"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <Input
                      label="Ngày sinh"
                      name="birthday"
                      type="date"
                      value={profileData.birthday}
                      onChange={(event) =>
                        setProfileData((prev) => ({
                          ...prev,
                          birthday: event.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Email"
                      value={user?.email || ""}
                      disabled
                      hint="Email không thể chỉnh sửa"
                      containerClassName="sm:col-span-2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={userLoading}
                    className="btn-base btn-primary h-11 px-6"
                  >
                    {userLoading ? "Đang xử lý" : "Lưu thay đổi"}
                  </button>

                  <div className="mt-8 space-y-5 rounded-[1.2rem] border border-black/10 bg-surface-soft p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-primary">
                          Địa chỉ giao hàng đã lưu
                        </h2>
                        <p className="text-sm text-secondary">
                          Chọn một địa chỉ mặc định và thêm vài địa chỉ khác để
                          dùng khi thanh toán.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm text-[color:var(--color-gold)]">
                        <MapPin className="h-4 w-4" />
                        {addressBook.length}/5 địa chỉ
                      </div>
                    </div>

                    {profileErrors.addressDraft && (
                      <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10">
                        {profileErrors.addressDraft}
                      </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Nhãn địa chỉ"
                        value={addressDraft.label}
                        onChange={(event) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            label: event.target.value,
                          }))
                        }
                        placeholder="Nhà riêng, Công ty..."
                      />
                      <Input
                        label="Người nhận"
                        value={addressDraft.fullName}
                        onChange={(event) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            fullName: event.target.value,
                          }))
                        }
                        placeholder="Nguyễn Văn A"
                      />
                      <Input
                        label="Số điện thoại"
                        value={addressDraft.phone}
                        onChange={(event) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="0912345678"
                      />
                      <Input
                        label="Tỉnh/Thành phố"
                        value={addressDraft.city}
                        onChange={(event) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            city: event.target.value,
                          }))
                        }
                        placeholder="Hà Nội"
                      />
                      <Input
                        label="Địa chỉ chi tiết"
                        value={addressDraft.address}
                        onChange={(event) =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            address: event.target.value,
                          }))
                        }
                        placeholder="Số nhà, đường, phường/xã"
                        containerClassName="sm:col-span-2"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setAddressDraft((prev) => ({
                            ...prev,
                            isDefault: !prev.isDefault,
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${addressDraft.isDefault ? "border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]" : "border-black/10 bg-white text-secondary dark:border-white/10 dark:bg-black/20"}`}
                      >
                        <Check className="h-4 w-4" />
                        {addressDraft.isDefault
                          ? "Đang đặt làm mặc định"
                          : "Đặt làm mặc định"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddressDraft}
                        className="btn-base btn-primary h-10 px-4"
                      >
                        <Plus className="h-4 w-4" />
                        Lưu địa chỉ
                      </button>
                      {isEditingAddress && (
                        <button
                          type="button"
                          onClick={resetAddressDraft}
                          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                          Hủy sửa (Thêm mới)
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {addressBook.map((address) => (
                        <div
                          key={address.id}
                          className={`rounded-2xl border p-4 ${address.id === defaultAddressId ? "border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/5" : "border-black/10 bg-white dark:border-white/10 dark:bg-black/10"}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-primary">
                                  {address.label}
                                </p>
                                {address.id === defaultAddressId && (
                                  <span className="rounded-full bg-[color:var(--color-gold)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-gold)]">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-secondary">
                                {address.fullName || user?.name} •{" "}
                                {address.phone || user?.phone || "Chưa có SĐT"}
                              </p>
                              <p className="text-sm text-secondary">
                                {address.address}
                                {address.city ? `, ${address.city}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {address.id !== defaultAddressId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetDefaultAddress(address.id)
                                  }
                                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-secondary hover:border-[color:var(--color-gold)]/40 hover:text-[color:var(--color-gold)]"
                                >
                                  Đặt mặc định
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditAddress(address)}
                                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-secondary hover:border-[color:var(--color-gold)]/40 hover:text-[color:var(--color-gold)]"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-secondary hover:border-red-300 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="hero-title text-3xl">Đơn hàng của tôi</h1>
                    <p className="mt-1 text-sm text-secondary">
                      Theo dõi trạng thái và quản lý các đơn đã đặt.
                    </p>
                  </div>

                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-16 animate-pulse rounded-xl bg-surface-soft"
                        />
                      ))}
                    </div>
                  ) : sortedOrders.length === 0 ? (
                    <div className="rounded-[1.8rem] border border-black/10 bg-surface p-10 text-center shadow-md dark:border-white/10">
                      <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-surface-soft dark:border-white/10">
                        <Package className="h-8 w-8 text-[color:var(--color-gold)]" />
                      </div>
                      <h2 className="hero-title text-3xl">
                        Chưa có dấu ấn nào
                      </h2>
                      <p className="mx-auto mt-4 max-w-lg text-sm text-secondary sm:text-base">
                        Bộ sưu tập cá nhân của bạn hiện chưa có sản phẩm nào.
                        Khám phá ngay những thiết kế độc bản.
                      </p>
                      <Link
                        to="/catalog"
                        className="btn-base btn-primary mt-7 h-11 px-6"
                      >
                        Khám phá Bộ Sưu Tập
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
                              <p className="font-semibold text-primary">
                                #
                                {order.orderCode ||
                                  order._id.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}{" "}
                                • {order.products?.length || 0} sản phẩm
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[color:var(--color-gold)]">
                                {order.totalAmount?.toLocaleString("vi-VN")} đ
                              </p>
                              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-secondary">
                                <span
                                  className={`inline-flex h-1.5 w-1.5 rounded-full ${statusDotClass(order.status)}`}
                                />
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
                <form
                  onSubmit={handlePasswordSubmit}
                  className="max-w-lg space-y-4"
                >
                  <div>
                    <h1 className="hero-title text-3xl">Đổi mật khẩu</h1>
                    <p className="mt-1 text-sm text-secondary">
                      Cập nhật mật khẩu để tăng cường bảo mật tài khoản.
                    </p>
                  </div>

                  {[
                    ["currentPassword", "Mật khẩu hiện tại", "old"],
                    ["newPassword", "Mật khẩu mới", "next"],
                    ["confirmPassword", "Xác nhận mật khẩu", "confirm"],
                  ].map(([field, label, flag]) => (
                    <div key={field} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        {label}
                      </p>
                      <div className="relative">
                        <input
                          type={showPassword[flag] ? "text" : "password"}
                          value={passwordData[field]}
                          onChange={(event) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              [field]: event.target.value,
                            }))
                          }
                          className="input-base pr-11"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              [flag]: !prev[flag],
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition hover:text-primary"
                        >
                          {showPassword[flag] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={userLoading}
                    className="btn-base btn-primary h-11 px-6"
                  >
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
                  <h2 className="hero-title text-3xl">
                    Đơn #
                    {selectedOrder.orderCode ||
                      selectedOrder._id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                  <span
                    className={`inline-flex h-1.5 w-1.5 rounded-full ${statusDotClass(selectedOrder.status)}`}
                  />
                  {statusText(selectedOrder.status)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-soft p-4 text-sm">
                  <p className="font-semibold text-primary">
                    Thông tin giao hàng
                  </p>
                  <p className="mt-2 text-secondary">
                    {selectedOrder.shippingDetails?.fullName}
                  </p>
                  <p className="text-secondary">
                    {selectedOrder.shippingDetails?.phoneNumber}
                  </p>
                  <p className="text-secondary">
                    {selectedOrder.shippingDetails?.address}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-soft p-4 text-sm">
                  <p className="font-semibold text-primary">Thanh toán</p>
                  <p className="mt-2 text-secondary">
                    Phương thức: {selectedOrder.paymentMethod?.toUpperCase()}
                  </p>
                  <p className="text-secondary">
                    Trạng thái:{" "}
                    {selectedOrder.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : "Chờ thanh toán"}
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--color-gold)]">
                    {selectedOrder.totalAmount?.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {selectedOrder.products?.map((item, index) => (
                  <div
                    key={`${item.product?._id || index}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-black/10 bg-surface-soft p-3 text-sm dark:border-white/10"
                  >
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-muted">x{item.quantity}</p>
                    </div>
                    <p className="font-semibold text-primary">
                      {item.price?.toLocaleString("vi-VN")} đ
                    </p>
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
                  <Link
                    to={`/order-tracking/${selectedOrder.trackingToken}`}
                    className="btn-base btn-secondary h-10 px-5"
                  >
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
