import { useCallback, useEffect, useState } from "react";
import {
  Save,
  Layout,
  Type,
  Grid,
  MessageSquareText,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Layers,
  GripVertical,
  Sliders,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Megaphone,
  Phone,
  Mail,
  MapPin,
  Share2,
  Plus,
  Trash2,
  Globe,
  Paintbrush,
  Code2,
  BarChart3,
  Cookie,
  ShoppingBag,
  Monitor,
  Smartphone,
  Star,
  Zap,
} from "lucide-react";
import { useStorefrontStore } from "../../stores/useStorefrontStore";

const ALL_SECTIONS = [
  {
    key: "hero",
    label: "Hero Banner",
    desc: "Banner động dạng Slide trượt đầu trang kèm slogan",
  },
  {
    key: "flashSale",
    label: "Flash Sale",
    desc: "Khu vực khuyến mãi, sản phẩm sale & đếm ngược",
  },
  {
    key: "bestSeller",
    label: "Sản phẩm Bán Chạy",
    desc: "Grid sản phẩm được lọc theo doanh số bán cao nhất",
  },
];

const THEME_PRESETS = [
  {
    key: "midnight",
    label: "Midnight Gold (Mặc định)",
    desc: "Phông nền tối sâu thẳm, điểm nhấn sắc vàng hoàng gia xa hoa",
    accent:
      "bg-black text-[color:var(--color-gold)] border-[color:var(--color-gold)]/30",
  },
  {
    key: "platinum",
    label: "Platinum Pearl (Sáng/Lịch lãm)",
    desc: "Phông nền kem ngọc trai ngà, chữ than và viền kim bạc thanh khiết",
    accent: "bg-stone-100 text-stone-900 border-stone-300",
  },
  {
    key: "emerald",
    label: "Emerald Prestige (Quyền quý)",
    desc: "Sắc xanh lục bảo ngọc bảo sang trọng kết hợp xám đen",
    accent: "bg-[#0b1b17] text-emerald-400 border-emerald-900",
  },
];

// A helper component to prevent lag on text input by buffering values locally and only calling onChange on blur
const BufferedInput = ({
  value,
  onChange,
  className,
  placeholder,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || "")) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
    />
  );
};

const BufferedTextarea = ({
  value,
  onChange,
  className,
  placeholder,
  rows,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || "")) {
      onChange(localValue);
    }
  };

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

const StoreSettingsTab = () => {
  const { config, fetchConfig, updateConfig, loading } = useStorefrontStore();
  const [formData, setFormData] = useState(null);
  const [sectionLayout, setSectionLayout] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("sections"); // sections, theme, slides, marketing, popup, footer, layout
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [collapsedSlides, setCollapsedSlides] = useState({}); // { [index]: true } means collapsed

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setFormData({
        ...config,
        themePreset: config.themePreset || "midnight",
        themeMode: config.themeMode || "dark",
        // Custom Colors
        primaryColor: config.primaryColor || "",
        secondaryColor: config.secondaryColor || "",
        accentColor: config.accentColor || "",
        bgColor: config.bgColor || "",
        cardBgColor: config.cardBgColor || "",
        textPrimaryColor: config.textPrimaryColor || "",
        textSecondaryColor: config.textSecondaryColor || "",
        borderColor: config.borderColor || "",
        // Typography
        headingFont: config.headingFont || "",
        bodyFont: config.bodyFont || "",
        headingScale: config.headingScale ?? 100,
        bodyScale: config.bodyScale ?? 100,
        // Favicon & Mobile Logo
        favicon: config.favicon || "",
        mobileLogoImage: config.mobileLogoImage || "",
        // Integrations
        googleAnalyticsId: config.googleAnalyticsId || "",
        facebookPixelId: config.facebookPixelId || "",
        tiktokPixelId: config.tiktokPixelId || "",
        // Cookie Consent
        cookieConsentEnabled: !!config.cookieConsentEnabled,
        cookieConsentTitle:
          config.cookieConsentTitle || "Trang web này sử dụng Cookie",
        cookieConsentText:
          config.cookieConsentText ||
          "Chúng tôi dùng cookie để cá nhân hóa trải nghiệm mua sắm của bạn.",
        // Custom CSS
        customCSS: config.customCSS || "",
        // Catalog
        productsPerPage: config.productsPerPage || 12,
        defaultSort: config.defaultSort || "newest",
        showOutOfStock: config.showOutOfStock !== false,
        flashSaleEndDate: config.flashSaleEndDate || "",
        heroSlides: (
          config.heroSlides || [
            {
              image:
                "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600",
              mobileImage: "",
              title: "Kiệt tác Thời gian",
              subtitle: "Khám phá đồng hồ cao cấp làm nên đẳng cấp của bạn.",
              link: "/catalog?reset=true",
              active: true,
            },
          ]
        ).map((s) => ({ ...s, active: s.active !== false })),
        promoPopupEnabled: !!config.promoPopupEnabled,
        promoPopupTitle: config.promoPopupTitle || "ĐĂNG KÝ THÀNH VIÊN VIP",
        promoPopupText:
          config.promoPopupText ||
          "Đăng ký nhận tin để nhận ngay đặc quyền ưu đãi 5% cho đơn hàng đầu tiên.",
        promoPopupImage:
          config.promoPopupImage ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
        promoPopupDelay: config.promoPopupDelay || 5,
        footerHotline: config.footerHotline || "1900 6789",
        footerEmail: config.footerEmail || "contact@luxurywatch.vn",
        footerAddress:
          config.footerAddress || "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
        footerAboutText:
          config.footerAboutText ||
          "Luxury Watch Gallery tự hào là hệ thống phân phối đồng hồ cao cấp chính hãng hàng đầu Việt Nam, với hơn 20 năm kinh nghiệm.",
        footerCopyright:
          config.footerCopyright ||
          "© {year} Luxury Watch Gallery. Tất cả quyền được bảo lưu.",
        footerColumns: config.footerColumns || [
          {
            title: "Dịch vụ Khách hàng",
            links: [
              { label: "Trung tâm trợ giúp", link: "/support" },
              { label: "Chính sách đổi trả", link: "/returns" },
              { label: "Bảo hành & Sửa chữa", link: "/warranty" },
              { label: "Hướng dẫn mua hàng", link: "/guide" },
            ],
          },
          {
            title: "Về Chúng tôi",
            links: [
              { label: "Câu chuyện thương hiệu", link: "/about" },
              { label: "Showroom", link: "/stores" },
              { label: "Tuyển dụng", link: "/careers" },
              { label: "Liên hệ", link: "/contact" },
            ],
          },
        ],
        footerFacebook: config.footerFacebook || "https://facebook.com",
        footerInstagram: config.footerInstagram || "https://instagram.com",
        footerZalo: config.footerZalo || "https://zalo.me",
        footerTiktok: config.footerTiktok || "",
        footerYoutube: config.footerYoutube || "",
        footerPinterest: config.footerPinterest || "",
        logoText: config.logoText || "LUXURY WATCH GALLERY",
        logoSubtext: config.logoSubtext || "LW",
        logoImage: config.logoImage || "",
        announcementEnabled: config.announcementEnabled !== false,
        announcementText:
          config.announcementText ||
          "Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng đồng hồ cao cấp từ 10 triệu đồng!",
        announcementBg: config.announcementBg || "gold",
        announcementLink: config.announcementLink || "/catalog?reset=true",
        seoTitle:
          config.seoTitle ||
          "Luxury Watch Gallery | Đồng Hồ Cao Cấp Chính Hãng",
        seoMetaDesc:
          config.seoMetaDesc ||
          "Hệ thống phân phối đồng hồ cao cấp, chính hãng từ các thương hiệu hàng đầu thế giới như Rolex, Omega, Hublot. Bảo hành trọn đời.",
        navigationItems: config.navigationItems || [
          { label: "Trang chủ", link: "/" },
          { label: "Bộ sưu tập", link: "/catalog" },
          { label: "Thương hiệu", link: "/brands" },
          { label: "Về chúng tôi", link: "/about" },
          { label: "Hỗ trợ", link: "/support" },
        ],
        storeWorkingHours:
          config.storeWorkingHours ||
          "Mở cửa hàng ngày: 09:00 - 21:00 (Cả Thứ Bảy & Chủ Nhật)",
      });

      const saved = config.homeLayout || ["hero", "flashSale", "bestSeller"];
      const ordered = saved.filter((k) =>
        ALL_SECTIONS.find((s) => s.key === k),
      );
      const disabled = ALL_SECTIONS.map((s) => s.key).filter(
        (k) => !ordered.includes(k),
      );
      setSectionLayout([
        ...ordered.map((k) => ({ key: k, enabled: true })),
        ...disabled.map((k) => ({ key: k, enabled: false })),
      ]);
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const numberFields = [
      "gridColumns",
      "featuredCount",
      "promoPopupDelay",
      "headingScale",
      "bodyScale",
      "productsPerPage",
    ];
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : numberFields.includes(name)
            ? Number(value)
            : value,
    }));
  };

  const toggleSection = (key) => {
    setSectionLayout((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const moveSection = (key, direction) => {
    setSectionLayout((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  // Slides dynamic list manipulation
  const handleSlideChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const slides = [...(prev.heroSlides || [])];
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, heroSlides: slides };
    });
  }, []);

  // Reorder slide: move slide at `fromIndex` to position `toPosition` (1-based)
  const reorderSlide = (fromIndex, toPosition) => {
    const slides = formData.heroSlides || [];
    const toIndex = Math.max(0, Math.min(slides.length - 1, toPosition - 1));
    if (toIndex === fromIndex) return;
    const arr = [...slides];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    // Update collapsed state to follow the moved slide
    setCollapsedSlides((prev) => {
      const next = {};
      arr.forEach((_, i) => {
        if (!prev[i]) next[i] = false;
        else next[i] = true;
      });
      return next;
    });
    setFormData((prev) => ({ ...prev, heroSlides: arr }));
  };

  const toggleSlideCollapse = (index) => {
    setCollapsedSlides((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleImageUpload = (indexOrKey, field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước tệp tối đa là 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadingIndex({ index: indexOrKey, field });
      const imageValue = e.target.result;
      if (indexOrKey === "branding" || indexOrKey === "advanced") {
        setFormData((prev) => ({ ...prev, [field]: imageValue }));
      } else {
        handleSlideChange(indexOrKey, field, imageValue);
      }
      setUploadingIndex(null);
    };
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    setFormData((prev) => ({
      ...prev,
      heroSlides: [
        ...(prev.heroSlides || []),
        {
          image:
            "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600",
          mobileImage: "",
          title: "Slide mới",
          subtitle: "Khám phá các thiết kế tinh hoa mới nhất.",
          link: "/catalog?reset=true",
          active: true,
        },
      ],
    }));
  };

  const removeSlide = (index) => {
    if (formData.heroSlides.length <= 1) {
      alert("Bạn phải giữ lại ít nhất 1 Slide chính đầu trang!");
      return;
    }
    setFormData((prev) => {
      const slides = (prev.heroSlides || []).filter((_, i) => i !== index);
      return { ...prev, heroSlides: slides };
    });
  };

  const moveSlide = (index, direction) => {
    setFormData((prev) => {
      const slides = [...(prev.heroSlides || [])];
      const target = index + direction;
      if (target < 0 || target >= slides.length) return prev;
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...prev, heroSlides: slides };
    });
  };

  // Navigation items manipulation
  const handleNavItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...(prev.navigationItems || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, navigationItems: items };
    });
  };

  const addNavItem = () => {
    setFormData((prev) => ({
      ...prev,
      navigationItems: [
        ...(prev.navigationItems || []),
        { label: "Menu mới", link: "/catalog" },
      ],
    }));
  };

  const removeNavItem = (index) => {
    if (formData.navigationItems.length <= 1) {
      alert("Bạn phải giữ lại ít nhất 1 mục điều hướng chính!");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      navigationItems: (prev.navigationItems || []).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const moveNavItem = (index, direction) => {
    setFormData((prev) => {
      const items = [...(prev.navigationItems || [])];
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= items.length) return prev;
      [items[index], items[newIdx]] = [items[newIdx], items[index]];
      return { ...prev, navigationItems: items };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const homeLayout = sectionLayout.filter((s) => s.enabled).map((s) => s.key);
    updateConfig({ ...formData, homeLayout });
  };

  if (!formData)
    return (
      <div className="p-8 text-center text-sm text-gray-400">
        Đang tải cấu hình Storefront...
      </div>
    );

  const sidebarMenu = [
    { id: "sections", label: "Sections trang chủ", icon: Layers },
    { id: "branding", label: "Bản sắc & Menu", icon: Type },
    { id: "theme", label: "Chủ đề & Màu sắc", icon: Palette },
    { id: "slides", label: "Slide Hero (Đầu trang chủ)", icon: ImageIcon },
    { id: "marketing", label: "Văn bản & Tiêu đề", icon: Megaphone },
    { id: "popup", label: "Pop-up Đón khách VIP", icon: Sparkles },
    { id: "footer", label: "Thông tin Chân trang", icon: Globe },
    { id: "footerDetail", label: "Footer Nâng cao", icon: Star },
    { id: "seo", label: "SEO & Giờ mở cửa", icon: Globe },
    { id: "layout", label: "Bố cục", icon: Sliders },
    // Orphan tabs — stored in DB but not yet consumed by user frontend (đang phát triển)
    { id: "colors", label: "Màu Tuỳ chỉnh", icon: Paintbrush, dev: true },
    { id: "typography", label: "Kiểu chữ", icon: Type, dev: true },
    { id: "integrations", label: "Tích hợp", icon: BarChart3, dev: true },
    { id: "catalog", label: "Cấu hình Catalog", icon: ShoppingBag, dev: true },
    { id: "advanced", label: "CSS & Nâng cao", icon: Code2, dev: true },
  ];

  return (
    <div className="w-full p-4">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-bold font-luxury text-luxury-gold flex items-center gap-2.5">
            <Layout className="w-5 h-5" /> Quản Lý Giao Diện Khách Hàng
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Thiết kế thẩm mỹ, cấu trúc hiển thị và các văn bản quảng bá toàn
            trang. Mọi thay đổi áp dụng trực tiếp thời gian thực.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-luxury-gold hover:bg-yellow-500 text-lux-dark font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-lg disabled:opacity-50 flex-shrink-0 self-start md:self-auto"
        >
          {loading ? (
            <span className="animate-spin rounded-full w-3.5 h-3.5 border-b-2 border-lux-dark"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          LƯU & XUẤT BẢN NGAY
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Settings Tabs Sidebar */}
        <aside className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/5 pr-0 lg:pr-4 shrink-0 admin-scroll">
          {sidebarMenu.map((menu) => {
            const Icon = menu.icon;
            const active = activeSubTab === menu.id;
            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveSubTab(menu.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {menu.label}
              </button>
            );
          })}
        </aside>

        {/* Main Config Form Area */}
        <main className="bg-white/60 dark:bg-luxury-darker/30 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-white/5 p-5 md:p-6 min-h-[480px]">
          {/* 1. SECTIONS LAYOUT MANAGER */}
          {activeSubTab === "sections" && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Layers className="w-4 h-4 text-luxury-gold" /> Bật/Tắt & Sắp
                  xếp Sections Trang Chủ
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sắp xếp luồng cuộn trang của khách hàng theo thứ tự ưu tiên
                  của chiến dịch bán hàng.
                </p>
              </div>

              <div className="space-y-2">
                {sectionLayout.map((item, idx) => {
                  const meta = ALL_SECTIONS.find((s) => s.key === item.key);
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${item.enabled ? "border-luxury-gold/30 bg-luxury-gold/5" : "border-gray-200 dark:border-gray-800 opacity-40 bg-transparent"}`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {meta?.label}
                          </p>
                          {item.enabled ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                              Hiển thị
                            </span>
                          ) : (
                            <span className="text-[9px] bg-gray-500/10 text-gray-400 border border-gray-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                              Đã ẩn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {meta?.desc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSection(item.key, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 text-gray-400 hover:text-white transition"
                          title="Lên trên"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(item.key, 1)}
                          disabled={idx === sectionLayout.length - 1}
                          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 text-gray-400 hover:text-white transition"
                          title="Xuống dưới"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection(item.key)}
                          className={`p-1.5 rounded-lg transition ml-1 ${item.enabled ? "text-luxury-gold hover:bg-luxury-gold/10" : "text-gray-400 hover:bg-white/10"}`}
                          title={item.enabled ? "Tắt section" : "Bật section"}
                        >
                          {item.enabled ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1.B. BRANDING & NAVIGATION MENU */}
          {activeSubTab === "branding" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Type className="w-4 h-4 text-luxury-gold" /> Bản sắc Thương
                  hiệu, Logo & Menu Điều hướng
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cấu hình Tên cửa hàng, Logo nghệ thuật, Thanh thông báo sự
                  kiện (Announcement Bar) và Menu điều hướng linh hoạt.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo configuration card */}
                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5 mb-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Logo & Tên Cửa Hàng
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        TÊN THƯƠNG HIỆU CHÍNH (LOGO TEXT)
                      </label>
                      <input
                        type="text"
                        name="logoText"
                        value={formData.logoText || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition font-medium"
                        placeholder="VD: LUXURY WATCH GALLERY"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        CHỮ VIẾT TẮT (LOGO SUBTEXT / ICON)
                      </label>
                      <input
                        type="text"
                        name="logoSubtext"
                        value={formData.logoSubtext || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition font-medium"
                        placeholder="VD: LW"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        HOẶC DÙNG ẢNH LOGO RIÊNG (DESKTOP LOGO IMAGE)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="logoImage"
                          value={formData.logoImage || ""}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                          placeholder="VD: https://path-to-your-logo.png"
                        />
                        <label className="flex items-center justify-center px-3 py-2 rounded border border-luxury-gold/30 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/10 text-xs font-semibold cursor-pointer transition select-none flex-shrink-0 min-w-[90px]">
                          {uploadingIndex?.index === "branding" &&
                          uploadingIndex?.field === "logoImage" ? (
                            <span className="w-3.5 h-3.5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            "Tải ảnh từ máy"
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(
                                "branding",
                                "logoImage",
                                e.target.files[0],
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Khuyên dùng logo định dạng SVG hoặc PNG nền trong suốt
                        để có hiển thị hoàn hảo nhất.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Announcement Bar card */}
                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" /> Thanh Thông Báo
                      Khuyến Mãi Đầu Trang
                    </h4>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="announcementEnabled"
                        checked={!!formData.announcementEnabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            announcementEnabled: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="relative w-7 h-4 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:ring-1 peer-focus:ring-luxury-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-luxury-gold"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        NỘI DUNG THÔNG BÁO
                      </label>
                      <textarea
                        name="announcementText"
                        value={formData.announcementText || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition leading-normal font-light"
                        placeholder="VD: Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        HÒA SẮC NỀN THANH THÔNG BÁO
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            key: "gold",
                            label: "Vàng Hoàng Gia",
                            class: "bg-luxury-gold text-black",
                          },
                          {
                            key: "dark",
                            label: "Đen Quyền Lực",
                            class: "bg-black text-white",
                          },
                          {
                            key: "light",
                            label: "Kem/Bạc Sáng",
                            class:
                              "bg-gray-100 text-black border border-gray-300",
                          },
                        ].map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                announcementBg: preset.key,
                              }))
                            }
                            className={`p-2 rounded-lg text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1 transition-all ${preset.class} ${formData.announcementBg === preset.key ? "ring-2 ring-blue-500 scale-[1.03]" : "opacity-75 hover:opacity-100"}`}
                          >
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        ĐƯỜNG DẪN LIÊN KẾT (URL CHUYỂN TRANG)
                      </label>
                      <input
                        type="text"
                        name="announcementLink"
                        value={formData.announcementLink || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                        placeholder="VD: /catalog?discount=true"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Navigation Links editor */}
              <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Quản Lý Menu Điều Hướng
                      (Navigation Links)
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Thay đổi nhãn, hoán đổi vị trí và thêm mới các tab liên
                      kết hiển thị ở Navbar đầu trang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addNavItem}
                    className="bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3 h-3" /> Thêm Menu Link
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.navigationItems || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/5 dark:bg-black/30 rounded-lg border border-gray-200/50 dark:border-white/5"
                    >
                      <span className="text-[10px] font-bold text-luxury-gold shrink-0 w-6">
                        #{index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                            Tên hiển thị:
                          </span>
                          <input
                            type="text"
                            value={item.label || ""}
                            onChange={(e) =>
                              handleNavItemChange(
                                index,
                                "label",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold"
                            placeholder="VD: Bộ sưu tập"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                            Đường dẫn:
                          </span>
                          <input
                            type="text"
                            value={item.link || ""}
                            onChange={(e) =>
                              handleNavItemChange(index, "link", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold"
                            placeholder="VD: /catalog"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveNavItem(index, -1)}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-gray-400 transition"
                          title="Lên trên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveNavItem(index, 1)}
                          disabled={
                            index ===
                            (formData.navigationItems || []).length - 1
                          }
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-gray-400 transition"
                          title="Xuống dưới"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNavItem(index)}
                          className="p-1 rounded hover:bg-red-500/10 text-red-400 ml-1.5 transition"
                          title="Xóa Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ━━━ COLORS – Custom Color Palette ━━━ */}
          {activeSubTab === "colors" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Paintbrush className="w-4 h-4 text-luxury-gold" /> Bảng Màu
                  Tuỳ Chỉnh Thương Hiệu
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Tuỳ chỉnh từng mã màu HEX cho giao diện. Để trống để dùng màu
                  mặc định của Theme Preset. Chọn &quot;Custom&quot; ở tab Chủ
                  đề để kích hoạt.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: "primaryColor",
                    label: "Màu Chủ đạo (Primary)",
                    desc: "Nút bấm chính, link, accent chính",
                    defaultHex: "#D4AF37",
                  },
                  {
                    key: "secondaryColor",
                    label: "Màu Phụ (Secondary)",
                    desc: "Nút phụ, badge, hover phụ",
                    defaultHex: "#B49450",
                  },
                  {
                    key: "accentColor",
                    label: "Màu Nhấn (Accent)",
                    desc: "Highlight, flash sale, khuyến mãi",
                    defaultHex: "#EF4444",
                  },
                  {
                    key: "bgColor",
                    label: "Nền Chính (Background)",
                    desc: "Màu nền toàn trang",
                    defaultHex: "#0A0A0A",
                  },
                  {
                    key: "cardBgColor",
                    label: "Nền Thẻ SP (Card BG)",
                    desc: "Nền các card sản phẩm",
                    defaultHex: "#1A1A1A",
                  },
                  {
                    key: "textPrimaryColor",
                    label: "Chữ Chính (Text Primary)",
                    desc: "Chữ tiêu đề, chữ chính",
                    defaultHex: "#FFFFFF",
                  },
                  {
                    key: "textSecondaryColor",
                    label: "Chữ Phụ (Text Secondary)",
                    desc: "Chữ mô tả, subtitle",
                    defaultHex: "#9CA3AF",
                  },
                  {
                    key: "borderColor",
                    label: "Viền (Border)",
                    desc: "Viền card, input, divider",
                    defaultHex: "#2A2A2A",
                  },
                ].map((color) => (
                  <div
                    key={color.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20"
                  >
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={formData[color.key] || color.defaultHex}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [color.key]: e.target.value,
                          }))
                        }
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {color.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{color.desc}</p>
                    </div>
                    <input
                      type="text"
                      value={formData[color.key] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [color.key]: e.target.value,
                        }))
                      }
                      placeholder={color.defaultHex}
                      className="w-24 px-2 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-transparent text-[11px] text-center font-mono outline-none focus:border-luxury-gold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, [color.key]: "" }))
                      }
                      className="text-[10px] text-gray-400 hover:text-red-400 transition shrink-0"
                      title="Reset về mặc định"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div
                className="p-4 rounded-xl border border-gray-200 dark:border-white/5"
                style={{ background: formData.bgColor || "#0A0A0A" }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: formData.textSecondaryColor || "#9CA3AF" }}
                >
                  XEM TRƯỚC GIAO DIỆN
                </p>
                <div className="flex gap-2 mb-3">
                  <button
                    className="px-3 py-1.5 rounded text-[10px] font-bold"
                    style={{
                      background: formData.primaryColor || "#D4AF37",
                      color: "#000",
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-3 py-1.5 rounded text-[10px] font-bold border"
                    style={{
                      borderColor: formData.secondaryColor || "#B49450",
                      color: formData.secondaryColor || "#B49450",
                    }}
                  >
                    Secondary
                  </button>
                  <span
                    className="px-2 py-1.5 rounded text-[10px] font-bold"
                    style={{
                      background: formData.accentColor || "#EF4444",
                      color: "#fff",
                    }}
                  >
                    Accent
                  </span>
                </div>
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    background: formData.cardBgColor || "#1A1A1A",
                    borderColor: formData.borderColor || "#2A2A2A",
                  }}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: formData.textPrimaryColor || "#FFFFFF" }}
                  >
                    Rolex Submariner Date
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: formData.textSecondaryColor || "#9CA3AF" }}
                  >
                    Đồng hồ lặn chuyên nghiệp, chống nước 300m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ TYPOGRAPHY ━━━ */}
          {activeSubTab === "typography" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Type className="w-4 h-4 text-luxury-gold" /> Kiểu Chữ & Phông
                  Chữ
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Tuỳ chỉnh font chữ và kích thước hiển thị trên toàn bộ
                  website. Để trống để dùng font mặc định.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">
                    Font Chữ Tiêu đề (Heading Font)
                  </h4>
                  <select
                    value={formData.headingFont || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        headingFont: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                  >
                    <option value="">Mặc định hệ thống</option>
                    <option value="Playfair Display">
                      Playfair Display (Sang trọng)
                    </option>
                    <option value="Cormorant Garamond">
                      Cormorant Garamond (Cổ điển)
                    </option>
                    <option value="Montserrat">Montserrat (Hiện đại)</option>
                    <option value="Raleway">Raleway (Thanh lịch)</option>
                    <option value="Merriweather">
                      Merriweather (Truyền thống)
                    </option>
                    <option value="DM Serif Display">
                      DM Serif Display (Độc đáo)
                    </option>
                    <option value="Libre Baskerville">
                      Libre Baskerville (Lịch lãm)
                    </option>
                  </select>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold mt-4">
                    Font Chữ Nội dung (Body Font)
                  </h4>
                  <select
                    value={formData.bodyFont || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bodyFont: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                  >
                    <option value="">Mặc định hệ thống</option>
                    <option value="Inter">Inter (Dễ đọc)</option>
                    <option value="Lato">Lato (Phổ biến)</option>
                    <option value="Nunito Sans">Nunito Sans (Mềm mại)</option>
                    <option value="Open Sans">Open Sans (Thân thiện)</option>
                    <option value="Roboto">Roboto (Google Material)</option>
                    <option value="Source Sans 3">
                      Source Sans 3 (Chuyên nghiệp)
                    </option>
                    <option value="Noto Sans">
                      Noto Sans (Hỗ trợ tiếng Việt tốt)
                    </option>
                  </select>
                </div>

                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">
                    Tỉ lệ Kích thước
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Đã lược bỏ slider điều chỉnh scale để giữ phần quản trị gọn
                    hơn. Nếu cần thay đổi nhịp chữ, hãy dùng theme preset hoặc
                    bảng màu tuỳ chỉnh.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ FOOTER DETAIL – Enhanced Footer ━━━ */}
          {activeSubTab === "footerDetail" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Star className="w-4 h-4 text-luxury-gold" /> Footer Nâng Cao
                  – Giới thiệu, Cột Link, Mạng Xã Hội
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Quản lý văn bản giới thiệu, bản quyền, các cột liên kết động
                  và mạng xã hội mở rộng.
                </p>
              </div>

              {/* About Text & Copyright */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-luxury-gold">
                    Văn bản Giới thiệu Footer
                  </label>
                  <textarea
                    value={formData.footerAboutText || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        footerAboutText: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-luxury-gold">
                    Dòng Bản quyền (Copyright)
                  </label>
                  <input
                    type="text"
                    value={formData.footerCopyright || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        footerCopyright: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                    placeholder="© {year} Luxury Watch Gallery. Tất cả quyền được bảo lưu."
                  />
                  <p className="text-[10px] text-gray-500">
                    Dùng {"{year}"} để tự động điền năm hiện tại.
                  </p>
                </div>
              </div>

              {/* Footer Columns Editor */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">
                    Cột Liên kết Footer (Footer Columns)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        footerColumns: [
                          ...(prev.footerColumns || []),
                          {
                            title: "Cột mới",
                            links: [{ label: "Link mới", link: "/" }],
                          },
                        ],
                      }))
                    }
                    className="bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Thêm Cột
                  </button>
                </div>

                {(formData.footerColumns || []).map((col, colIdx) => (
                  <div
                    key={colIdx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={col.title || ""}
                        onChange={(e) => {
                          const cols = [...(formData.footerColumns || [])];
                          cols[colIdx] = {
                            ...cols[colIdx],
                            title: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            footerColumns: cols,
                          }));
                        }}
                        className="flex-1 px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-transparent text-xs font-bold outline-none focus:border-luxury-gold"
                        placeholder="Tên cột"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            footerColumns: (prev.footerColumns || []).filter(
                              (_, i) => i !== colIdx,
                            ),
                          }))
                        }
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pl-2">
                      {(col.links || []).map((link, linkIdx) => (
                        <div key={linkIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={link.label || ""}
                            onChange={(e) => {
                              const cols = [...(formData.footerColumns || [])];
                              const links = [...(cols[colIdx].links || [])];
                              links[linkIdx] = {
                                ...links[linkIdx],
                                label: e.target.value,
                              };
                              cols[colIdx] = { ...cols[colIdx], links };
                              setFormData((prev) => ({
                                ...prev,
                                footerColumns: cols,
                              }));
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-transparent text-[11px] outline-none focus:border-luxury-gold"
                            placeholder="Tên hiển thị"
                          />
                          <input
                            type="text"
                            value={link.link || ""}
                            onChange={(e) => {
                              const cols = [...(formData.footerColumns || [])];
                              const links = [...(cols[colIdx].links || [])];
                              links[linkIdx] = {
                                ...links[linkIdx],
                                link: e.target.value,
                              };
                              cols[colIdx] = { ...cols[colIdx], links };
                              setFormData((prev) => ({
                                ...prev,
                                footerColumns: cols,
                              }));
                            }}
                            className="w-32 px-2.5 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-transparent text-[11px] outline-none focus:border-luxury-gold"
                            placeholder="/path"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cols = [...(formData.footerColumns || [])];
                              cols[colIdx] = {
                                ...cols[colIdx],
                                links: (cols[colIdx].links || []).filter(
                                  (_, i) => i !== linkIdx,
                                ),
                              };
                              setFormData((prev) => ({
                                ...prev,
                                footerColumns: cols,
                              }));
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] px-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const cols = [...(formData.footerColumns || [])];
                          cols[colIdx] = {
                            ...cols[colIdx],
                            links: [
                              ...(cols[colIdx].links || []),
                              { label: "Link mới", link: "/" },
                            ],
                          };
                          setFormData((prev) => ({
                            ...prev,
                            footerColumns: cols,
                          }));
                        }}
                        className="text-[10px] text-luxury-gold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-2.5 h-2.5" /> Thêm link
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extended Social Links */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Mạng Xã Hội Mở Rộng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      TikTok URL
                    </label>
                    <input
                      type="text"
                      value={formData.footerTiktok || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          footerTiktok: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={formData.footerYoutube || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          footerYoutube: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      placeholder="https://youtube.com/@..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Pinterest URL
                    </label>
                    <input
                      type="text"
                      value={formData.footerPinterest || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          footerPinterest: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      placeholder="https://pinterest.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ INTEGRATIONS – Analytics & Tracking ━━━ */}
          {activeSubTab === "integrations" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <BarChart3 className="w-4 h-4 text-luxury-gold" /> Tích hợp
                  Theo dõi & Phân tích
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Kết nối Google Analytics, Facebook Pixel, TikTok Pixel để theo
                  dõi khách hàng và tối ưu quảng cáo.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "googleAnalyticsId",
                    label: "Google Analytics ID (GA4)",
                    icon: BarChart3,
                    placeholder: "G-XXXXXXXXXX",
                    desc: "Đo lường toàn diện hành vi người dùng trên website.",
                  },
                  {
                    key: "facebookPixelId",
                    label: "Facebook Pixel ID (Meta)",
                    icon: Share2,
                    placeholder: "1234567890123456",
                    desc: "Theo dõi chuyển đổi và tạo đối tượng quảng cáo trên Facebook & Instagram.",
                  },
                  {
                    key: "tiktokPixelId",
                    label: "TikTok Pixel ID",
                    icon: Zap,
                    placeholder: "XXXXXXXXXXXXXXX",
                    desc: "Đo lường hiệu quả quảng cáo TikTok Shop.",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-luxury-gold" />
                      <label className="text-xs font-bold text-gray-900 dark:text-white">
                        {item.label}
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData[item.key] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold font-mono"
                      placeholder={item.placeholder}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Cookie Consent */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                    <Cookie className="w-3.5 h-3.5" /> Thông báo Cookie (GDPR)
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.cookieConsentEnabled}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cookieConsentEnabled: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:ring-1 peer-focus:ring-luxury-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-luxury-gold"></div>
                    <span className="text-xs font-bold text-gray-300">
                      {formData.cookieConsentEnabled ? "Đang bật" : "Đang tắt"}
                    </span>
                  </label>
                </div>
                <div
                  className={`space-y-3 transition-all ${formData.cookieConsentEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                >
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Tiêu đề Cookie Banner
                    </label>
                    <input
                      type="text"
                      value={formData.cookieConsentTitle || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cookieConsentTitle: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Nội dung Cookie Banner
                    </label>
                    <textarea
                      value={formData.cookieConsentText || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cookieConsentText: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ CATALOG SETTINGS ━━━ */}
          {activeSubTab === "catalog" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <ShoppingBag className="w-4 h-4 text-luxury-gold" /> Cấu Hình
                  Trang Danh Mục Sản Phẩm
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cài đặt cách hiển thị sản phẩm trên trang Catalog / Bộ sưu
                  tập.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <label className="block text-xs font-bold text-luxury-gold">
                    Số sản phẩm mỗi trang
                  </label>
                  <div className="flex gap-2">
                    {[12, 24, 36, 48].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            productsPerPage: num,
                          }))
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${formData.productsPerPage === num ? "border-luxury-gold bg-luxury-gold/10 text-luxury-gold" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400"}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <label className="block text-xs font-bold text-luxury-gold">
                    Sắp xếp mặc định
                  </label>
                  <select
                    value={formData.defaultSort || "newest"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaultSort: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="best-selling">Bán chạy nhất</option>
                    <option value="price-asc">Giá: Thấp → Cao</option>
                    <option value="price-desc">Giá: Cao → Thấp</option>
                    <option value="name-asc">Tên: A → Z</option>
                    <option value="name-desc">Tên: Z → A</option>
                  </select>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.showOutOfStock}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          showOutOfStock: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:ring-1 peer-focus:ring-luxury-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-luxury-gold"></div>
                    <span className="text-xs font-bold text-gray-400">
                      Hiển thị sản phẩm hết hàng
                    </span>
                  </label>
                  <p className="text-[10px] text-gray-500">
                    Khi tắt, sản phẩm hết hàng sẽ bị ẩn khỏi trang danh mục.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ ADVANCED – Custom CSS, Favicon ━━━ */}
          {activeSubTab === "advanced" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Code2 className="w-4 h-4 text-luxury-gold" /> CSS Tuỳ Chỉnh &
                  Biểu Tượng Trang
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Dành cho nhà quản lý muốn tinh chỉnh giao diện ở cấp độ code.
                  CSS sẽ được áp dụng toàn trang.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Favicon */}
                <div className="space-y-3 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Favicon (Biểu tượng Tab
                    trình duyệt)
                  </h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.favicon || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          favicon: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      placeholder="https://your-site.com/favicon.ico"
                    />
                    <label className="flex items-center justify-center px-3 py-2 rounded border border-luxury-gold/30 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/10 text-xs font-semibold cursor-pointer transition shrink-0">
                      Tải lên
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(
                            "advanced",
                            "favicon",
                            e.target.files[0],
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.favicon && (
                    <div className="flex items-center gap-2 p-2 rounded bg-white dark:bg-black/30">
                      <img
                        src={formData.favicon}
                        alt="Favicon"
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span className="text-[10px] text-gray-500 truncate">
                        {formData.favicon}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500">
                    Khuyên dùng ảnh PNG hoặc ICO kích thước 32x32px hoặc
                    64x64px.
                  </p>
                </div>

                {/* Mobile Logo */}
                <div className="space-y-3 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Logo Riêng Cho Mobile
                  </h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.mobileLogoImage || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mobileLogoImage: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold"
                      placeholder="URL logo mobile (tuỳ chọn)"
                    />
                    <label className="flex items-center justify-center px-3 py-2 rounded border border-luxury-gold/30 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/10 text-xs font-semibold cursor-pointer transition shrink-0">
                      Tải lên
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(
                            "advanced",
                            "mobileLogoImage",
                            e.target.files[0],
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Nếu để trống, hệ thống sẽ dùng logo chính co dãn tự động.
                  </p>
                </div>
              </div>

              {/* Custom CSS editor intentionally removed to keep the admin UI focused and predictable. */}
              <div className="space-y-3 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> CSS Tuỳ Chỉnh Toàn Trang
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Mục chỉnh sửa CSS nâng cao đã được ẩn để tránh làm loãng phạm
                  vi quản trị. Thiết kế giao diện hiện được điều khiển qua
                  theme, bảng màu và logo.
                </p>
              </div>
            </div>
          )}

          {/* ━━━ SEO & WORKING HOURS ━━━ */}
          {activeSubTab === "seo" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Globe className="w-4 h-4 text-luxury-gold" /> Tối ưu hóa Tìm
                  kiếm (SEO) & Thiết lập Vận hành
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cấu hình tiêu đề hiển thị trên Google, Mô tả tiếp thị SEO để
                  tăng thứ hạng tìm kiếm và giờ mở cửa Showroom.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5" /> Tối ưu hóa SEO Metadata
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        TIÊU ĐỀ TRANG CỬA HÀNG (SEO TITLE)
                      </label>
                      <input
                        type="text"
                        name="seoTitle"
                        value={formData.seoTitle || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition font-medium"
                        placeholder="VD: Luxury Watch Gallery | Đồng Hồ Cao Cấp Chính Hãng"
                      />
                      <p className="text-[9px] text-gray-500 mt-1">
                        Khuyên dùng độ dài từ 50-60 ký tự để hiển thị tốt nhất
                        trên kết quả tìm kiếm Google.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        MÔ TẢ THƯƠNG HIỆU (META DESCRIPTION)
                      </label>
                      <textarea
                        name="seoMetaDesc"
                        value={formData.seoMetaDesc || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition leading-relaxed font-light"
                        placeholder="VD: Hệ thống phân phối đồng hồ cao cấp chính hãng..."
                        rows={4}
                      />
                      <p className="text-[9px] text-gray-500 mt-1">
                        Khuyên dùng dưới 160 ký tự để Google không bị cắt bớt
                        nội dung mô tả của bạn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Thời Gian Vận Hành Cửa
                      Hàng
                    </h4>
                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          GIỜ MỞ CỬA SHOWROOM
                        </label>
                        <input
                          type="text"
                          name="storeWorkingHours"
                          value={formData.storeWorkingHours || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs outline-none focus:border-luxury-gold transition font-medium"
                          placeholder="VD: Mở cửa hàng ngày: 09:00 - 21:00"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          Giờ làm việc này sẽ được hiển thị ở các khu vực thông
                          tin liên hệ và Chân trang Footer.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SEO Google Mockup Preview Card */}
                  <div className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/40 rounded-xl p-3.5 mt-4 space-y-1">
                    <p className="text-[9px] text-gray-400 flex items-center gap-1.5">
                      <Globe className="w-2.5 h-2.5" /> {window.location.origin}
                    </p>
                    <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
                      {formData.seoTitle}
                    </h5>
                    <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {formData.seoMetaDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. THEMES & BRAND COLORS */}
          {activeSubTab === "theme" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Palette className="w-4 h-4 text-luxury-gold" /> Chủ đề Thẩm
                  mỹ & Hệ màu sắc
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Thay đổi ngay lập tức cảm quan phong cách và hòa sắc cốt lõi
                  của website theo định hướng sang trọng.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-luxury-gold">
                  1. Chọn Hệ màu chủ đề chính
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {THEME_PRESETS.map((p) => {
                    const selected = formData.themePreset === p.key;
                    return (
                      <label
                        key={p.key}
                        className={`flex flex-col cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                          selected
                            ? "border-luxury-gold bg-luxury-gold/5 shadow-md shadow-luxury-gold/5"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="themePreset"
                          value={p.key}
                          checked={selected}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-gray-900 dark:text-white">
                            {p.label}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? "border-luxury-gold" : "border-gray-300"}`}
                          >
                            {selected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                          {p.desc}
                        </p>
                        <div
                          className={`mt-auto text-[10px] font-mono px-2 py-1 rounded text-center border ${p.accent}`}
                        >
                          Accent Color Variable
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-luxury-gold">
                  2. Chế độ hiển thị phông sáng/tối mặc định
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "dark",
                      label: "Always Dark (Khuyên dùng)",
                      desc: "Đúng chuẩn quiet luxury",
                    },
                    {
                      key: "light",
                      label: "Always Light (Lịch lãm)",
                      desc: "Phong cách tối giản tinh tế",
                    },
                    {
                      key: "system",
                      label: "System Auto (Hệ thống)",
                      desc: "Theo thiết bị của khách",
                    },
                  ].map((mode) => {
                    const selected = formData.themeMode === mode.key;
                    return (
                      <label
                        key={mode.key}
                        className={`flex flex-col items-center justify-center text-center cursor-pointer p-4 rounded-xl border-2 transition ${
                          selected
                            ? "border-luxury-gold bg-luxury-gold/5"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="themeMode"
                          value={mode.key}
                          checked={selected}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="font-bold text-xs text-gray-900 dark:text-white mb-1">
                          {mode.label}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {mode.desc}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. HERO SLIDES MANAGER */}
          {activeSubTab === "slides" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 text-primary">
                    <ImageIcon className="w-4 h-4 text-luxury-gold" /> Trình
                    Quản Lý Carousel Slides đầu trang
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Cấu hình nhiều banner quảng cáo dạng Slide trượt ở trang
                    chủ.
                    <span className="ml-2 text-luxury-gold/70">
                      Nhập số thứ tự để sắp xếp lại vị trí tức thì.
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSlide}
                  className="bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Slide
                </button>
              </div>

              {/* Slide order overview pills */}
              {(formData.heroSlides || []).length > 1 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {(formData.heroSlides || []).map((s, i) => (
                    <span
                      key={i}
                      onClick={() =>
                        setCollapsedSlides((prev) =>
                          Object.fromEntries(
                            (formData.heroSlides || []).map((_, j) => [
                              j,
                              j !== i,
                            ]),
                          ),
                        )
                      }
                      className={`cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        !collapsedSlides[i]
                          ? "bg-luxury-gold text-black border-luxury-gold"
                          : s.active !== false
                            ? "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 hover:bg-luxury-gold/20"
                            : "bg-gray-700/30 text-gray-500 border-gray-700 hover:bg-gray-700/50"
                      }`}
                      title={s.title || `Slide ${i + 1}`}
                    >
                      #{i + 1} {s.active === false ? "(tắt)" : ""}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-500 self-center ml-1">
                    — click để mở nhanh
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {(formData.heroSlides || []).map((slide, index) => {
                  const isCollapsed = !!collapsedSlides[index];
                  return (
                    <div
                      key={index}
                      className={`rounded-xl border transition-all ${
                        isCollapsed
                          ? "border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-black/20"
                          : "border-luxury-gold/30 bg-black/10 dark:bg-black/30"
                      }`}
                    >
                      {/* ── Slide accordion header ── */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none group"
                        onClick={() => toggleSlideCollapse(index)}
                      >
                        {/* Left: order input + title preview + status badge */}
                        <div
                          className="flex items-center gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Numeric position input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              Vị trí
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={(formData.heroSlides || []).length}
                              value={index + 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) reorderSlide(index, val);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-12 px-1.5 py-1 rounded border border-luxury-gold/40 bg-luxury-gold/5 text-luxury-gold text-xs font-bold text-center outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              title={`Nhập số thứ tự (1–${(formData.heroSlides || []).length}) để di chuyển slide này`}
                            />
                          </div>
                          {/* Active toggle */}
                          <label
                            className="flex items-center gap-1.5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={slide.active !== false}
                              onChange={(e) =>
                                handleSlideChange(
                                  index,
                                  "active",
                                  e.target.checked,
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="relative w-8 h-4 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:ring-1 peer-focus:ring-luxury-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-luxury-gold"></div>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {slide.active !== false ? "Bật" : "Tắt"}
                            </span>
                          </label>
                        </div>

                        {/* Right: title preview + expand/delete */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
                            {slide.title || `(Chưa đặt tên)`}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSlide(index);
                            }}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400 transition flex-shrink-0"
                            title="Xóa Slide này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? "" : "rotate-180"}`}
                          />
                        </div>
                      </div>

                      {/* ── Slide body (collapsible) ── */}
                      {!isCollapsed && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-200 dark:border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Tiêu đề Slide (Title)
                                </label>
                                <BufferedInput
                                  type="text"
                                  value={slide.title || ""}
                                  onChange={(val) =>
                                    handleSlideChange(index, "title", val)
                                  }
                                  className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                                  placeholder="VD: Kiệt tác Thời gian"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Mô tả phụ (Subtitle)
                                </label>
                                <BufferedTextarea
                                  value={slide.subtitle || ""}
                                  onChange={(val) =>
                                    handleSlideChange(index, "subtitle", val)
                                  }
                                  className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                                  placeholder="VD: Slogan tinh tế..."
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Link liên kết nút bấm (URL)
                                </label>
                                <BufferedInput
                                  type="text"
                                  value={slide.link || ""}
                                  onChange={(val) =>
                                    handleSlideChange(index, "link", val)
                                  }
                                  className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                                  placeholder="VD: /catalog?brand=Rolex"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Ảnh nền (Desktop Banner URL)
                                </label>
                                <div className="flex gap-2">
                                  <BufferedInput
                                    type="text"
                                    value={slide.image || ""}
                                    onChange={(val) =>
                                      handleSlideChange(index, "image", val)
                                    }
                                    className="flex-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                                    placeholder="VD: https://images.unsplash.com..."
                                  />
                                  <label className="flex items-center justify-center px-3 py-2 rounded border border-luxury-gold/30 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/10 text-xs font-semibold cursor-pointer transition select-none flex-shrink-0 min-w-[90px]">
                                    {uploadingIndex?.index === index &&
                                    uploadingIndex?.field === "image" ? (
                                      <span className="w-3.5 h-3.5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      "Tải ảnh từ máy"
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleImageUpload(
                                          index,
                                          "image",
                                          e.target.files[0],
                                        )
                                      }
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Ảnh nền riêng cho Mobile (Tùy chọn)
                                </label>
                                <div className="flex gap-2">
                                  <BufferedInput
                                    type="text"
                                    value={slide.mobileImage || ""}
                                    onChange={(val) =>
                                      handleSlideChange(
                                        index,
                                        "mobileImage",
                                        val,
                                      )
                                    }
                                    className="flex-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-800 bg-transparent text-xs outline-none focus:border-luxury-gold transition"
                                    placeholder="Để trống nếu muốn co dãn ảnh desktop tự động"
                                  />
                                  <label className="flex items-center justify-center px-3 py-2 rounded border border-luxury-gold/30 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/10 text-xs font-semibold cursor-pointer transition select-none flex-shrink-0 min-w-[90px]">
                                    {uploadingIndex?.index === index &&
                                    uploadingIndex?.field === "mobileImage" ? (
                                      <span className="w-3.5 h-3.5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      "Tải ảnh từ máy"
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleImageUpload(
                                          index,
                                          "mobileImage",
                                          e.target.files[0],
                                        )
                                      }
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                              {slide.image && (
                                <div className="border border-gray-200 dark:border-gray-800 rounded overflow-hidden h-24 bg-black/20">
                                  <img
                                    src={slide.image}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://placehold.co/600x200?text=Invalid+Image+URL";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. MARKETING CAMPAIGNS & TEXTS */}
          {activeSubTab === "marketing" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Megaphone className="w-4 h-4 text-luxury-gold" /> Các Văn bản
                  & Tiêu đề Tiếp thị
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Tinh chỉnh các slogan truyền cảm hứng và tiêu đề hiển thị các
                  phân khu trang chủ.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">
                  1. Tiêu đề khối & Slogan Tiếp thị
                </h4>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">
                    Slogan Trang Chủ (Hero Slogan)
                  </label>
                  <textarea
                    name="heroSlogan"
                    value={formData.heroSlogan || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    rows="2"
                    placeholder="Nhập câu châm ngôn thương hiệu..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Tiêu đề Banner Flash Sale
                    </label>
                    <input
                      type="text"
                      name="flashSaleTitle"
                      value={formData.flashSaleTitle || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Tiêu đề Khối Sản phẩm Bán chạy
                    </label>
                    <input
                      type="text"
                      name="bestSellerTitle"
                      value={formData.bestSellerTitle || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. WELCOME PROMO POP-UP */}
          {activeSubTab === "popup" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 text-luxury-gold" /> Pop-up Ưu
                    Đãi Đón Khách VIP (Welcome Promo)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Hiển thị một bảng thông điệp chào mừng ưu đãi sang trọng khi
                    khách vừa ghé thăm boutique.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="promoPopupEnabled"
                      checked={!!formData.promoPopupEnabled}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`block w-9 h-5 rounded-full transition-colors ${formData.promoPopupEnabled ? "bg-emerald-500" : "bg-gray-600"}`}
                    ></div>
                    <div
                      className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${formData.promoPopupEnabled ? "transform translate-x-4" : ""}`}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-gray-300">
                    Bật Pop-up
                  </span>
                </label>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all ${formData.promoPopupEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Tiêu đề Pop-up chào mừng
                    </label>
                    <input
                      type="text"
                      name="promoPopupTitle"
                      value={formData.promoPopupTitle || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                      placeholder="VD: ĐĂNG KÝ THÀNH VIÊN VIP"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Văn bản chiêu dụ nhận ưu đãi
                    </label>
                    <textarea
                      name="promoPopupText"
                      value={formData.promoPopupText || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                      rows="3"
                      placeholder="Nhập mô tả đặc quyền ưu đãi..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Thời gian chờ kích hoạt pop-up (Delay tính bằng giây)
                    </label>
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <input
                        type="number"
                        name="promoPopupDelay"
                        value={formData.promoPopupDelay || 5}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs text-center outline-none focus:border-luxury-gold"
                        min="1"
                      />
                      <span className="text-xs text-gray-400">giây</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Xuất hiện sau khi khách hàng vào lướt website đúng N giây.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      URL Hình ảnh nền bên trái Pop-up
                    </label>
                    <input
                      type="text"
                      name="promoPopupImage"
                      value={formData.promoPopupImage || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  {formData.promoPopupImage && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden h-36 bg-black/20 flex items-center justify-center relative">
                      <img
                        src={formData.promoPopupImage}
                        alt="Popup preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/300x200?text=Invalid+Image+URL";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 p-3 flex flex-col justify-end text-white">
                        <p className="text-[10px] font-bold tracking-wider text-luxury-gold uppercase">
                          {formData.promoPopupTitle}
                        </p>
                        <p className="text-[9px] text-gray-200 truncate mt-0.5">
                          {formData.promoPopupText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. GLOBAL FOOTER CONTACT & SOCIALS */}
          {activeSubTab === "footer" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Globe className="w-4 h-4 text-luxury-gold" /> Thông tin Chân
                  trang & Mạng xã hội của Showroom
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Đồng bộ Hotline, địa chỉ liên hệ và các đường dẫn mạng xã hội
                  hiển thị toàn diện ở chân trang Footer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-luxury-gold" /> Hotline
                    Showroom
                  </label>
                  <input
                    type="text"
                    name="footerHotline"
                    value={formData.footerHotline || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-luxury-gold" /> Email liên
                    hệ
                  </label>
                  <input
                    type="email"
                    name="footerEmail"
                    value={formData.footerEmail || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-luxury-gold" /> Showroom
                    chính (Địa chỉ)
                  </label>
                  <input
                    type="text"
                    name="footerAddress"
                    value={formData.footerAddress || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Đường dẫn Mạng xã hội của
                  thương hiệu
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      name="footerFacebook"
                      value={formData.footerFacebook || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">
                      Instagram URL
                    </label>
                    <input
                      type="text"
                      name="footerInstagram"
                      value={formData.footerInstagram || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">
                      Zalo Chat / Page Link
                    </label>
                    <input
                      type="text"
                      name="footerZalo"
                      value={formData.footerZalo || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-xs focus:ring-1 focus:ring-luxury-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. LAYOUT & AI ASSISTANT */}
          {activeSubTab === "layout" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b border-gray-100 dark:border-white/5 pb-3">
                  <Grid className="w-4 h-4 text-luxury-gold" /> Bố cục Lưới hiển
                  thị sản phẩm & Hệ thống AI
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Điều khiển thiết lập lưới sản phẩm trên trang mua sắm và
                  bật/tắt chatbot trí tuệ nhân tạo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-400">
                    Số cột hiển thị sản phẩm (Desktop)
                  </label>
                  <div className="flex gap-2">
                    {[4, 6].map((num) => (
                      <label
                        key={num}
                        className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-3.5 rounded-xl border-2 transition ${Number(formData.gridColumns) === num ? "border-luxury-gold bg-luxury-gold/5" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent"}`}
                      >
                        <input
                          type="radio"
                          name="gridColumns"
                          value={num}
                          checked={Number(formData.gridColumns) === num}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="font-bold text-base mb-0.5">
                          {num}
                        </span>
                        <span className="text-[10px] text-gray-500">Cột</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Mật độ hiển thị lưới đồng hồ trên màn hình máy tính của
                    trang Danh mục (Catalog).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-400">
                    Số lượng SP trưng bày trang chủ
                  </label>
                  <div className="flex gap-2">
                    {[4, 6, 8, 12].map((num) => (
                      <label
                        key={num}
                        className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-3.5 rounded-xl border-2 transition ${Number(formData.featuredCount) === num ? "border-luxury-gold bg-luxury-gold/5" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent"}`}
                      >
                        <input
                          type="radio"
                          name="featuredCount"
                          value={num}
                          checked={Number(formData.featuredCount) === num}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="font-bold text-base mb-0.5">
                          {num}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Đồng hồ
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Số lượng sản phẩm tối đa xuất hiện ở khối &quot;Tuyển chọn
                    tinh hoa&quot;.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-5">
                <label className="flex items-center gap-4 cursor-pointer bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="showChatBot"
                      checked={!!formData.showChatBot}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`block w-9 h-5 rounded-full transition-colors ${formData.showChatBot ? "bg-emerald-500" : "bg-gray-600"}`}
                    ></div>
                    <div
                      className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${formData.showChatBot ? "transform translate-x-4" : ""}`}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-luxury-gold" />
                    <div>
                      <span className="font-bold text-xs text-gray-900 dark:text-white block">
                        Kích hoạt Trợ lý AI Cố vấn mua sắm
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Hiển thị bong bóng trò chuyện tư vấn đồng hồ AI thông
                        minh ở góc phải màn hình của khách hàng.
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StoreSettingsTab;
