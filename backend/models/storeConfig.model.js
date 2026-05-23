import mongoose from "mongoose";

const storeConfigSchema = new mongoose.Schema(
	{
		// ── Theme Presets ───────────────────────────────────
		themePreset: {
			type: String,
			enum: ["midnight", "platinum", "emerald", "custom"],
			default: "midnight",
		},
		themeMode: {
			type: String,
			enum: ["dark", "light", "system"],
			default: "dark",
		},

		// ── Custom Colors (when themePreset='custom') ──────
		primaryColor: { type: String, default: "" },
		secondaryColor: { type: String, default: "" },
		accentColor: { type: String, default: "" },
		bgColor: { type: String, default: "" },
		cardBgColor: { type: String, default: "" },
		textPrimaryColor: { type: String, default: "" },
		textSecondaryColor: { type: String, default: "" },
		borderColor: { type: String, default: "" },

		// ── Typography ──────────────────────────────────────
		headingFont: { type: String, default: "" },
		bodyFont: { type: String, default: "" },
		headingScale: { type: Number, default: 100 },         // %
		bodyScale: { type: Number, default: 100 },            // %

		// ── Favicon & Mobile Logo ──────────────────────────
		favicon: { type: String, default: "" },
		mobileLogoImage: { type: String, default: "" },

		// ── Third-party Integrations ───────────────────────
		googleAnalyticsId: { type: String, default: "" },
		facebookPixelId: { type: String, default: "" },
		tiktokPixelId: { type: String, default: "" },

		// ── Cookie Consent ─────────────────────────────────
		cookieConsentEnabled: { type: Boolean, default: false },
		cookieConsentTitle: { type: String, default: "Trang web này sử dụng Cookie" },
		cookieConsentText: { type: String, default: "Chúng tôi dùng cookie để cá nhân hóa trải nghiệm mua sắm của bạn." },

		// ── Custom CSS ─────────────────────────────────────
		customCSS: { type: String, default: "" },

		// ── Catalog / Product Display ──────────────────────
		productsPerPage: { type: Number, default: 12 },
		defaultSort: {
			type: String,
			enum: ["newest", "price-asc", "price-desc", "best-selling", "name-asc", "name-desc"],
			default: "newest",
		},
		showOutOfStock: { type: Boolean, default: true },

		flashSaleEndDate: {
			type: String,
			default: "",
		},
		heroSlides: {
			type: [{
				image: { type: String, default: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600" },
				mobileImage: { type: String, default: "" },
				title: { type: String, default: "Kiệt tác Thời gian" },
				subtitle: { type: String, default: "Khám phá đồng hồ cao cấp làm nên đẳng cấp của bạn." },
				link: { type: String, default: "/catalog?reset=true" },
				active: { type: Boolean, default: true }
			}],
			default: [
				{
					image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600",
					mobileImage: "",
					title: "Kiệt tác Thời gian",
					subtitle: "Khám phá đồng hồ cao cấp làm nên đẳng cấp của bạn.",
					link: "/catalog?reset=true",
					active: true
				}
			],
		},
		promoPopupEnabled: {
			type: Boolean,
			default: false,
		},
		promoPopupTitle: {
			type: String,
			default: "ĐĂNG KÝ THÀNH VIÊN VIP",
		},
		promoPopupText: {
			type: String,
			default: "Đăng ký nhận tin để nhận ngay đặc quyền ưu đãi 5% cho đơn hàng đầu tiên.",
		},
		promoPopupImage: {
			type: String,
			default: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
		},
		promoPopupDelay: {
			type: Number,
			default: 5,
		},
		footerHotline: {
			type: String,
			default: "1900 6789",
		},
		footerEmail: {
			type: String,
			default: "contact@luxurywatch.vn",
		},
		footerAddress: {
			type: String,
			default: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
		},
		footerAboutText: {
			type: String,
			default: "Luxury Watch Gallery tự hào là hệ thống phân phối đồng hồ cao cấp chính hãng hàng đầu Việt Nam, với hơn 20 năm kinh nghiệm.",
		},
		footerCopyright: {
			type: String,
			default: "© {year} Luxury Watch Gallery. Tất cả quyền được bảo lưu.",
		},
		footerColumns: {
			type: [{
				title: { type: String },
				links: [{
					label: { type: String },
					link: { type: String },
				}],
			}],
			default: [
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
		},
		footerFacebook: {
			type: String,
			default: "https://facebook.com",
		},
		footerInstagram: {
			type: String,
			default: "https://instagram.com",
		},
		footerZalo: {
			type: String,
			default: "https://zalo.me",
		},
		footerTiktok: { type: String, default: "" },
		footerYoutube: { type: String, default: "" },
		footerPinterest: { type: String, default: "" },
		homeLayout: {
			type: [String],
			// A.7 Fix: homeLayout may contain "chatbot" section, but showChatBot is the MASTER switch.
			// If showChatBot=false, the chatbot section in homeLayout is ignored by the frontend.
			// If showChatBot=true but "chatbot" is not in homeLayout, chatbot is still hidden.
			// BOTH conditions must be true for chatbot to show: showChatBot=true AND "chatbot" in homeLayout.
			default: ["hero", "flashSale", "bestSeller", "chatbot"],
		},
		gridColumns: {
			type: Number,
			enum: [3, 4, 5, 6],
			default: 4,
		},
		featuredCount: {
			type: Number,
			enum: [4, 6, 8, 12],
			default: 4,
		},
		heroSlogan: {
			type: String,
			default: "Khám phá đồng hồ cao cấp làm nên đẳng cấp của bạn.",
		},
		bestSellerTitle: {
			type: String,
			default: "Sản phẩm Bán chạy",
		},
		flashSaleTitle: {
			type: String,
			default: "Ưu Đãi Đặc Biệt",
		},
		// A.7: showChatBot is the MASTER toggle for chatbot visibility.
		// chatbot section in homeLayout controls POSITION/ORDER only.
		showChatBot: {
			type: Boolean,
			default: true,
		},
		logoText: {
			type: String,
			default: "LUXURY WATCH GALLERY",
		},
		logoSubtext: {
			type: String,
			default: "LW",
		},
		logoImage: {
			type: String,
			default: "",
		},
		announcementEnabled: {
			type: Boolean,
			default: true,
		},
		announcementText: {
			type: String,
			default: "Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng đồng hồ cao cấp từ 10 triệu đồng!",
		},
		announcementBg: {
			type: String,
			default: "gold",
		},
		announcementLink: {
			type: String,
			default: "/catalog?reset=true",
		},
		seoTitle: {
			type: String,
			default: "Luxury Watch Gallery | Đồng Hồ Cao Cấp Chính Hãng",
		},
		seoMetaDesc: {
			type: String,
			default: "Hệ thống phân phối đồng hồ cao cấp, chính hãng từ các thương hiệu hàng đầu thế giới như Rolex, Omega, Hublot. Bảo hành trọn đời.",
		},
		navigationItems: {
			type: [{
				label: { type: String, required: true },
				link: { type: String, required: true },
			}],
			default: [
				{ label: "Trang chủ", link: "/" },
				{ label: "Bộ sưu tập", link: "/catalog" },
				{ label: "Thương hiệu", link: "/brands" },
				{ label: "Về chúng tôi", link: "/about" },
				{ label: "Hỗ trợ", link: "/support" }
			],
		},
		storeWorkingHours: {
			type: String,
			default: "Mở cửa hàng ngày: 09:00 - 21:00 (Cả Thứ Bảy & Chủ Nhật)",
		},
	},
	{ timestamps: true }
);

const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
export default StoreConfig;
