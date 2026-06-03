import { useState } from "react";
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Power,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { confirmToast } from "../../lib/confirmToast";
import { useMarketingManagement } from "../../hooks/useMarketingManagement";

const campaignGroups = [
  { value: "Entire Catalog", label: "Toàn bộ danh mục" },
  { value: "Đồng hồ nam", label: "Đồng hồ nam" },
  { value: "Đồng hồ nữ", label: "Đồng hồ nữ" },
  { value: "Đồng hồ unisex", label: "Đồng hồ unisex" },
  { value: "Smartwatch", label: "Smartwatch" },
  { value: "automatic", label: "Cơ tự động" },
  { value: "mechanical", label: "Cơ lên cót tay" },
  { value: "quartz", label: "Máy pin" },
  { value: "solar", label: "Năng lượng ánh sáng" },
];

const MarketingTab = () => {
  const {
    campaigns,
    banners,
    bannersLoading,
    creating,
    formData,
    setFormData,
    bannerInputRef,
    handleCreateCampaign,
    handleBannerUpload,
    handleDeleteBanner,
    handleToggleBannerStatus,
    handleReorderBanner,
    handleMoveBannerToPosition,
    toggleCampaignStatus,
    deleteCampaign,
    formatDate,
    previewProduct,
    activeCampaigns,
    handleUpdateBanner,
  } = useMarketingManagement();

  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary tracking-tight">
            Marketing & Chiến Dịch
          </h2>
          <p className="text-secondary max-w-2xl">
            Thiết lập và tự động hoá các chương trình khuyến mãi cho hệ thống
            toàn cầu.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface border border-black/8 dark:border-white/8 p-4 rounded-2xl min-w-[140px]">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
              Đang hoạt động
            </p>
            <span className="text-3xl font-bold text-primary">
              {activeCampaigns}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ BANNER MANAGEMENT ═══ */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[color:var(--color-gold)]" />{" "}
              Quản lý Banner Chiến Dịch & Khuyến Mãi (Giữa trang chủ)
            </h3>
            <p className="text-[11px] text-gray-400 mt-1 max-w-2xl">
              * Lưu ý: Banner tại đây hiển thị tại phần Chiến dịch Khuyến mãi
              giữa trang chủ. Để thay đổi các Slide trượt kích thước lớn ở đầu
              trang chủ, vui lòng sử dụng tab{" "}
              <span className="font-semibold text-luxury-gold">
                &quot;Slide Hero (Đầu trang chủ)&quot;
              </span>{" "}
              trong phần{" "}
              <span className="font-semibold text-luxury-gold">
                Quản lý giao diện
              </span>
              .
            </p>
          </div>
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[color:var(--color-gold)] text-[color:var(--color-gold)] text-sm font-semibold transition hover:bg-[color:var(--color-gold)] hover:text-white shrink-0 h-fit"
          >
            <Plus className="w-4 h-4" /> Tải lên Banner Mới
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload placeholder */}
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="relative group h-48 rounded-2xl overflow-hidden border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[color:var(--color-gold)] bg-[color:var(--color-surface-2)] transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <ImageIcon className="w-10 h-10 text-muted group-hover:text-[color:var(--color-gold)] transition-colors" />
            <p className="text-sm text-secondary group-hover:text-primary transition-colors font-medium">
              Click để tải banner mới
            </p>
            <p className="text-[10px] text-muted">
              JPG, PNG, WEBP — tối đa 5MB
            </p>
          </div>

          {bannersLoading ? (
            <div className="col-span-full py-12 text-center text-muted">
              Đang tải danh sách banner...
            </div>
          ) : (
            banners.map((banner, index) => (
              <div
                key={banner._id}
                className="relative group h-48 rounded-2xl overflow-hidden border border-black/8 dark:border-white/8 bg-surface"
              >
                {editingBannerId === banner._id ? (
                  <div className="absolute inset-0 bg-luxury-dark/95 p-4 flex flex-col justify-between z-10 border border-luxury-gold/30 rounded-2xl">
                    <h4 className="text-xs font-semibold text-luxury-gold uppercase tracking-wider">
                      Cập nhật Banner
                    </h4>
                    <div className="space-y-2 my-auto">
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-black/40 border border-luxury-gold/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-luxury-gold transition"
                          placeholder="Nhập tiêu đề banner"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">
                          Đường dẫn liên kết (Link)
                        </label>
                        <input
                          type="text"
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          className="w-full bg-black/40 border border-luxury-gold/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-luxury-gold transition"
                          placeholder="VD: /category/dong-ho-nam"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingBannerId(null)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-700 text-white text-xs font-semibold hover:bg-gray-600 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Hủy
                      </button>
                      <button
                        onClick={async () => {
                          const success = await handleUpdateBanner(banner._id, {
                            title: editTitle,
                            link: editLink,
                          });
                          if (success) {
                            setEditingBannerId(null);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-luxury-gold text-luxury-dark text-xs font-bold hover:bg-luxury-gold-light transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-luxury-darker flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-luxury-border" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 bg-black/60 text-white px-1.5 py-0.5 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[9px] font-bold text-gray-300">
                          Vị trí
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={banners.length}
                          value={index + 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (
                              !isNaN(val) &&
                              val >= 1 &&
                              val <= banners.length
                            ) {
                              handleMoveBannerToPosition(banner._id, val);
                            }
                          }}
                          className="w-8 h-4 px-0.5 rounded border border-luxury-gold/40 bg-luxury-gold/10 text-luxury-gold text-[10px] font-bold text-center outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          title={`Nhập số thứ tự (1–${banners.length}) để di chuyển banner này`}
                        />
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest ${banner.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-500"} text-white`}
                      >
                        {banner.status}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleReorderBanner(banner._id, -1)}
                        disabled={index === 0}
                        className="p-1 bg-black/50 rounded text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Di chuyển lên"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleReorderBanner(banner._id, 1)}
                        disabled={index === banners.length - 1}
                        className="p-1 bg-black/50 rounded text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Di chuyển xuống"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-sm truncate">
                        {banner.title}
                      </h3>
                      <p className="text-gray-300 dark:text-luxury-text-muted text-[10px]">
                        {formatDate(banner.uploadedAt)}
                      </p>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleToggleBannerStatus(banner._id)}
                        className="p-2 bg-luxury-dark rounded-lg text-luxury-gold hover:bg-luxury-gold hover:text-luxury-dark transition"
                        title={banner.status === "ACTIVE" ? "Tắt" : "Bật"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingBannerId(banner._id);
                          setEditTitle(banner.title || "");
                          setEditLink(banner.link || "");
                        }}
                        className="p-2 bg-luxury-dark rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition"
                        title="Chỉnh sửa tiêu đề & link"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner._id)}
                        className="p-2 bg-luxury-dark rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition"
                        title="Xóa banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ═══ CAMPAIGN CREATION ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form tạo chiến dịch */}
        <div className="lg:col-span-1 bg-surface border border-black/8 dark:border-white/8 rounded-2xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-semibold text-primary">
            Tạo chiến dịch mới
          </h3>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">
              Tên chiến dịch
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              type="text"
              placeholder="VD: Flash Sale 8/3"
              className="w-full bg-[color:var(--color-surface-2)] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">
              Nhóm áp dụng
            </label>
            <select
              value={formData.group}
              onChange={(e) =>
                setFormData({ ...formData, group: e.target.value })
              }
              className="w-full bg-[color:var(--color-surface-2)] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] transition"
            >
              {campaignGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">
              Phần trăm giảm (%)
            </label>
            <div className="relative">
              <input
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercentage: e.target.value,
                  })
                }
                type="number"
                min="1"
                max="100"
                placeholder="15"
                className="w-full bg-[color:var(--color-surface-2)] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold text-lg">
                %
              </span>
            </div>
          </div>

          {/* Preview discount */}
          {previewProduct && formData.discountPercentage && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/30 p-4 rounded-xl space-y-2 shadow-sm">
              <p className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest mb-1">
                Mô phỏng giá trị
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={previewProduct.image}
                  className="w-12 h-12 rounded-lg object-cover"
                  alt=""
                />
                <div>
                  <p className="text-xs text-gray-900 dark:text-white font-medium line-clamp-1">
                    {previewProduct.name}
                  </p>
                  <div className="flex gap-2 items-center">
                    <span className="line-through text-xs text-gray-400 dark:text-luxury-text-muted">
                      {previewProduct.price.toLocaleString("vi-VN")}₫
                    </span>
                    <span className="font-bold text-luxury-gold text-sm">
                      {(
                        previewProduct.price *
                        (1 - formData.discountPercentage / 100)
                      ).toLocaleString("vi-VN")}
                      ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">
                Bắt đầu
              </label>
              <input
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                type="datetime-local"
                className="w-full bg-[color:var(--color-surface-2)] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] transition cursor-pointer dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">
                Kết thúc
              </label>
              <input
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                type="datetime-local"
                className="w-full bg-[color:var(--color-surface-2)] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] transition cursor-pointer dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={creating}
            className="w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-bold py-4 rounded-xl transition duration-300 mt-4 shadow-lg shadow-luxury-gold/20 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {creating ? (
              <>
                <span className="w-5 h-5 border-2 border-luxury-dark border-t-transparent rounded-full animate-spin"></span>
                Đang xử lý...
              </>
            ) : (
              "Kích hoạt chiến dịch"
            )}
          </button>
        </div>

        {/* Campaign list */}
        <div className="lg:col-span-2 bg-surface border border-black/8 dark:border-white/8 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary">
              Danh sách chiến dịch
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-black/8 dark:border-white/8">
                  <th className="pb-3 text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Chiến dịch
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Nhóm
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Discount
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Thời gian
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Status
                  </th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {(!campaigns || campaigns.length === 0) && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-muted">
                      Chưa có chiến dịch nào
                    </td>
                  </tr>
                )}
                {campaigns?.map((camp) => (
                  <tr
                    key={camp._id}
                    className={`group hover:bg-[color:var(--color-surface-2)] transition-colors ${!camp.isActive ? "opacity-50" : ""}`}
                  >
                    <td className="py-4">
                      <div className="font-semibold text-primary">
                        {camp.name}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">
                        ID: {camp._id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="py-4 text-sm text-secondary">
                      {camp.isGlobal
                        ? "Toàn bộ danh mục"
                        : camp.group || "Toàn bộ danh mục"}
                    </td>
                    <td className="py-4 font-bold text-[color:var(--color-gold)]">
                      {camp.discountPercentage}%
                    </td>
                    <td className="py-4 text-[10px] text-muted">
                      {formatDate(camp.startDate)} <br />
                      <span className="text-gray-400 dark:text-gray-500">
                        tới
                      </span>{" "}
                      {formatDate(camp.endDate)}
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${camp.status === "Active" ? "bg-emerald-500" : camp.status === "Scheduled" ? "bg-blue-500" : "bg-gray-500"}`}
                        />
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${camp.status === "Active" ? "text-luxury-gold" : camp.status === "Scheduled" ? "text-luxury-gold" : "text-gray-500"}`}
                        >
                          {camp.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => toggleCampaignStatus(camp._id)}
                        className="p-1.5 rounded-lg text-muted hover:text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)]/8 transition mr-1"
                        title="Bật/Tắt"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          confirmToast(
                            `Xóa chiến dịch "${camp.name}"?`,
                            async () => {
                              await deleteCampaign(camp._id);
                            },
                          );
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/8 transition"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingTab;
