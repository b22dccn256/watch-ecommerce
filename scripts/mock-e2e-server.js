import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = Number(process.env.MOCK_E2E_PORT || 5000);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const nowIso = () => new Date().toISOString();
let seq = 1;
const nextId = (prefix = "id") => `${prefix}_${String(seq++).padStart(6, "0")}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

const makeBrand = (overrides = {}) => ({
  _id: nextId("brand"),
  name: "Rolex",
  description: "Luxury Swiss watches",
  logo: "https://via.placeholder.com/120x60?text=Rolex",
  isAuthorizedDealer: true,
  createdAt: nowIso(),
  ...overrides,
});

const makeCategory = (overrides = {}) => ({
  _id: nextId("cat"),
  name: "Dress Watches",
  slug: "dress-watches",
  image: "https://via.placeholder.com/64",
  parentCategory: null,
  isActive: true,
  createdAt: nowIso(),
  ...overrides,
});

const makeProduct = (brand, category, overrides = {}) => ({
  _id: nextId("prod"),
  name: "Rolex Datejust 36",
  slug: "rolex-datejust-36",
  description: "Mock luxury watch product",
  image:
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80",
  images: [],
  price: 123456000,
  originalPrice: 130000000,
  costPrice: 90000000,
  stock: 6,
  lowStockThreshold: 5,
  brand: { _id: brand._id, name: brand.name },
  category: category.name,
  categoryId: category._id,
  type: "automatic",
  machineType: "Automatic",
  strapMaterial: "Steel",
  color: "Silver",
  sizes: ["40mm"],
  averageRating: 4.8,
  salesCount: 12,
  isFeatured: true,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  ...overrides,
});

const baseBrand = makeBrand();
const baseCategory = makeCategory();
const secondaryCategory = makeCategory({
  name: "Sport Watches",
  slug: "sport-watches",
});
const baseProduct = makeProduct(baseBrand, baseCategory);
const secondProduct = makeProduct(baseBrand, secondaryCategory, {
  name: "Omega Speedmaster",
  slug: "omega-speedmaster",
  stock: 2,
  price: 98000000,
  salesCount: 7,
  lowStockThreshold: 3,
});

const state = {
  users: [
    {
      _id: nextId("user"),
      name: "Admin User",
      email: process.env.E2E_ADMIN_EMAIL || "ha8893536@gmail.com",
      password: process.env.E2E_ADMIN_PASSWORD || "admin123",
      role: "admin",
      rewardPoints: 25,
      tags: ["VIP"],
      adminNotes: "Existing admin note",
    },
    // Additional admin for E2E tests that use default admin@test.local credentials
    {
      _id: nextId("user"),
      name: "E2E Admin",
      email: process.env.E2E_ADMIN_EMAIL_2 || "admin@test.local",
      password: process.env.E2E_ADMIN_PASSWORD_2 || "Admin123!@#",
      role: "admin",
      rewardPoints: 50,
      tags: ["E2E"],
      adminNotes: "Secondary admin for E2E tests",
    },
    {
      _id: nextId("user"),
      name: "E2E Customer",
      email: "customer@example.com",
      password: "Customer123!",
      role: "customer",
      rewardPoints: 10,
      tags: [],
      adminNotes: "",
      phone: "0900000000",
    },
  ],
  brands: [baseBrand],
  categories: [baseCategory, secondaryCategory],
  products: [baseProduct, secondProduct],
  banners: [
    {
      _id: nextId("banner"),
      title: "Hero Banner",
      image:
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
      imageUrl:
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
      status: "ACTIVE",
      uploadedAt: nowIso(),
    },
  ],
  campaigns: [
    {
      _id: nextId("campaign"),
      name: "Mock Flash Sale",
      group: "Entire Catalog",
      discountPercentage: 10,
      startDate: nowIso(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      isGlobal: true,
      status: "Active",
      isActive: true,
    },
  ],
  coupons: [
    {
      _id: nextId("coupon"),
      code: "SUMMER10",
      discountPercentage: 10,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  ],
  orders: [],
  carts: {},
  inventoryLogs: {},
  reviews: [
    {
      _id: nextId("review"),
      userName: "Minh",
      productName: baseProduct.name,
      rating: 5,
      comment: "Great watch",
      status: "pending",
      createdAt: nowIso(),
    },
  ],
  questions: [
    {
      _id: nextId("question"),
      userName: "Lan",
      productName: baseProduct.name,
      question: "Có chống nước không?",
      answer: "",
      createdAt: nowIso(),
    },
  ],
  mail: {
    stats: { totalSent: 12, openRate: 42, clickRate: 8 },
    inbox: [
      {
        _id: nextId("mail"),
        from: "customer@example.com",
        subject: "Hỏi về bảo hành",
        createdAt: nowIso(),
      },
    ],
    subscribers: [
      { _id: nextId("sub"), email: "sub@example.com", createdAt: nowIso() },
    ],
    campaigns: [
      {
        _id: nextId("mc"),
        name: "Welcome Series",
        status: "sent",
        createdAt: nowIso(),
      },
    ],
    templates: [
      {
        _id: nextId("tpl"),
        name: "Welcome",
        subject: "Welcome to Luxury Watch",
      },
    ],
    automations: [
      { _id: nextId("auto"), name: "Abandoned Cart", active: true },
    ],
  },
  storeConfig: {
    heroSlogan: "Luxury watches for every occasion",
    heroTitle: "Luxury Watch",
    heroSubtitle: "Mock storefront config",
    logoText: "LUXURY WATCH GALLERY",
    footerHotline: "1900 6789",
    footerEmail: "contact@luxurywatch.vn",
    footerAddress: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    footerAboutText:
      "Luxury Watch Gallery tự hào là hệ thống phân phối đồng hồ cao cấp chính hãng hàng đầu Việt Nam, với hơn 20 năm kinh nghiệm.",
    footerCopyright:
      "© {year} Luxury Watch Gallery. Tất cả quyền được bảo lưu.",
    updatedAt: nowIso(),
  },
};

const seedOrder = (user, product) => {
  const order = {
    _id: nextId("order"),
    orderCode: `ORD${String(seq).padStart(4, "0")}`,
    user: { _id: user._id, name: user.name, email: user.email },
    products: [{ product: clone(product), quantity: 1, price: product.price }],
    shippingDetails: {
      fullName: user.name,
      phoneNumber: user.phone || "0900000000",
      address: "123 Mock Street",
      city: "Ho Chi Minh",
      orderNotes: "Handle with care",
    },
    totalAmount: product.price,
    paymentMethod: "cod",
    paymentStatus: "paid",
    status: "pending",
    currency: "VND",
    internalNotes: "",
    returnReason: "",
    refundAmount: 0,
    carrier: "",
    carrierTrackingNumber: "",
    createdAt: nowIso(),
  };
  state.orders.push(order);
};

seedOrder(state.users[1], baseProduct);

const authCookie = "mock_auth";

const getCurrentUser = (req) =>
  state.users.find((user) => user._id === req.cookies[authCookie]) || null;
const ensureAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = user;
  next();
};

const ensureAdmin = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: "Access denied - Bạn không có quyền thực hiện hành động này",
      });
  }
  req.user = user;
  next();
};

const ensureManagement = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!["admin", "staff"].includes(user.role)) {
    return res
      .status(403)
      .json({
        message: "Access denied - Bạn không có quyền thực hiện hành động này",
      });
  }
  req.user = user;
  next();
};

const normalizeProduct = (product) => ({
  ...product,
  brand:
    typeof product.brand === "string"
      ? state.brands.find((brand) => brand._id === product.brand) || {
          _id: product.brand,
          name: product.brand,
        }
      : product.brand,
});

const getCartForUser = (userId) => {
  if (!state.carts[userId]) {
    state.carts[userId] = [];
  }
  return state.carts[userId];
};

app.get("/api/settings", (_req, res) => {
  res.json(clone(state.storeConfig));
});

app.put("/api/settings", ensureAdmin, (req, res) => {
  state.storeConfig = {
    ...state.storeConfig,
    ...req.body,
    updatedAt: nowIso(),
  };
  res.json(clone(state.storeConfig));
});

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (state.users.some((user) => user.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }
  const user = {
    _id: nextId("user"),
    name,
    email,
    password,
    phone,
    role: "customer",
    emailVerified: true,
    rewardPoints: 0,
    tags: [],
    adminNotes: "",
  };
  state.users.push(user);
  res.status(201).json({ message: "Signup successful" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = state.users.find(
    (candidate) => candidate.email === email && candidate.password === password,
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.cookie(authCookie, user._id, { httpOnly: false, sameSite: "lax" });
  res.json(clone({ ...user, password: undefined }));
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(authCookie);
  res.json({ message: "Logged out" });
});

app.post("/api/auth/refresh-token", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ ok: true });
});

app.post("/api/auth/resend-verification", (_req, res) =>
  res.json({ message: "Verification email resent" }),
);
app.post("/api/auth/resend-otp", (_req, res) =>
  res.json({ message: "OTP resent" }),
);
app.post("/api/auth/verify-otp", ensureAuth, (req, res) =>
  res.json(clone(req.user)),
);
app.post("/api/auth/verify-email", (_req, res) =>
  res.json({ message: "Email verified" }),
);

app.get("/api/auth/profile", ensureAuth, (req, res) => {
  res.json(clone({ ...req.user, password: undefined }));
});

app.patch("/api/auth/profile", ensureAuth, (req, res) => {
  Object.assign(req.user, req.body);
  res.json({
    message: "Profile updated",
    user: clone({ ...req.user, password: undefined }),
  });
});

app.patch("/api/auth/change-password", ensureAuth, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
  }

  if (req.user.password !== currentPassword) {
    return res
      .status(401)
      .json({ message: "Mật khẩu hiện tại không chính xác" });
  }

  req.user.password = newPassword || req.user.password;
  return res.json({ message: "Mật khẩu đã được thay đổi thành công" });
});

app.get("/api/auth/users", ensureManagement, (req, res) => {
  const limit = Number(req.query.limit || state.users.length);
  const users = state.users
    .slice(0, limit)
    .map((user) => ({ ...user, password: undefined }));
  res.json({ users, pagination: { totalUsers: state.users.length } });
});

app.get("/api/auth/audit-logs", ensureAdmin, (_req, res) => {
  res.json({
    logs: [
      {
        _id: nextId("audit"),
        action: "login",
        actor: "admin",
        createdAt: nowIso(),
      },
    ],
  });
});

app.patch("/api/auth/users/:id/role", ensureAdmin, (req, res) => {
  const user = state.users.find((entry) => entry._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.role = req.body.role || user.role;
  res.json(clone(user));
});

app.patch("/api/auth/users/:id/loyalty", ensureAdmin, (req, res) => {
  const user = state.users.find((entry) => entry._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const points =
    req.body.delta !== undefined
      ? req.body.delta
      : req.body.points !== undefined
        ? req.body.points
        : 0;
  user.rewardPoints = Number(user.rewardPoints || 0) + Number(points);
  res.json(clone(user));
});

app.patch("/api/auth/users/:id/admin-notes", ensureAdmin, (req, res) => {
  const user = state.users.find((entry) => entry._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (Array.isArray(req.body.tags)) user.tags = req.body.tags;
  if (typeof req.body.adminNotes === "string")
    user.adminNotes = req.body.adminNotes;
  res.json(clone(user));
});

app.get("/api/analytics", ensureAdmin, (_req, res) => {
  res.json({
    users: state.users.length,
    products: state.products.length,
    totalSales: state.orders.length,
    totalRevenue: state.orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    ),
    aov: state.orders.length
      ? Math.round(
          state.orders.reduce((sum, order) => sum + order.totalAmount, 0) /
            state.orders.length,
        )
      : 0,
    totalOrdersPlaced: state.orders.length,
    conversionRate: 2.5,
    hourlySalesData: [],
    paymentStats: [
      {
        name: "COD",
        value: state.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
    ],
    wristSizeStats: [{ size: "16cm", count: 3 }],
    dailySales: [
      { name: "T2", sales: 1, revenue: 123456000 },
      { name: "T3", sales: 2, revenue: 223456000 },
    ],
  });
});

app.get("/api/analytics/pl", ensureAdmin, (req, res) => {
  const days = Number(req.query.days || 7);
  res.json({
    summary: {
      days,
      totalRevenue: 350000000,
      totalCogs: 210000000,
      totalGrossProfit: 140000000,
      totalMargin: 40,
    },
    daily: [
      { name: "T2", revenue: 100000000, cogs: 60000000, grossProfit: 40000000 },
      {
        name: "T3",
        revenue: 250000000,
        cogs: 150000000,
        grossProfit: 100000000,
      },
    ],
  });
});

app.get("/api/brands", (_req, res) => res.json(clone(state.brands)));
app.post("/api/brands", ensureAdmin, (req, res) => {
  const brand = makeBrand({
    name: req.body.name,
    description: req.body.description || "",
    logo: req.body.logo || req.body.image || "",
    isAuthorizedDealer: req.body.isAuthorizedDealer ?? true,
  });
  state.brands.push(brand);
  res.status(201).json(clone(brand));
});
app.delete("/api/brands/:id", ensureAdmin, (req, res) => {
  state.brands = state.brands.filter((brand) => brand._id !== req.params.id);
  res.json({ success: true });
});
app.put("/api/brands/:id", ensureAdmin, (req, res) => {
  const brand = state.brands.find((entry) => entry._id === req.params.id);
  if (!brand) return res.status(404).json({ message: "Brand not found" });
  Object.assign(brand, {
    name: req.body.name ?? brand.name,
    description: req.body.description ?? brand.description,
    logo: req.body.logo ?? req.body.image ?? brand.logo,
    isAuthorizedDealer: req.body.isAuthorizedDealer ?? brand.isAuthorizedDealer,
  });
  res.json(clone(brand));
});

app.get("/api/categories", (_req, res) => res.json(clone(state.categories)));
app.post("/api/categories", ensureAdmin, (req, res) => {
  const category = makeCategory({
    name: req.body.name,
    slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, "-"),
    parentCategory: req.body.parentCategory || null,
    image: req.body.image || "",
  });
  state.categories.push(category);
  res.status(201).json(clone(category));
});
app.put("/api/categories/:id", ensureAdmin, (req, res) => {
  const category = state.categories.find(
    (entry) => entry._id === req.params.id,
  );
  if (!category) return res.status(404).json({ message: "Category not found" });
  Object.assign(category, {
    name: req.body.name ?? category.name,
    slug:
      req.body.slug ??
      req.body.name?.toLowerCase().replace(/\s+/g, "-") ??
      category.slug,
    parentCategory: req.body.parentCategory ?? category.parentCategory,
    image: req.body.image ?? category.image,
  });
  res.json(clone(category));
});
app.delete("/api/categories/:id", ensureAdmin, (req, res) => {
  state.categories = state.categories.filter(
    (category) => category._id !== req.params.id,
  );
  res.json({ success: true });
});

app.get("/api/products/featured", (_req, res) => {
  res.json(
    clone(
      state.products
        .filter((product) => product.isFeatured)
        .map(normalizeProduct),
    ),
  );
});

app.get("/api/products/recommendations", (_req, res) => {
  res.json(clone(state.products.slice(0, 3).map(normalizeProduct)));
});

app.get("/api/products/suggestions", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  res.json(
    clone(
      state.products
        .filter((product) => product.name.toLowerCase().includes(q))
        .slice(0, 5)
        .map((product) => ({ _id: product._id, name: product.name })),
    ),
  );
});

app.get("/api/products/export", (_req, res) => {
  res.type("text/csv").send("name,price\nMock Product,123456");
});

app.post("/api/products/import/preview", upload.any(), (_req, res) =>
  res.json({ rows: [] }),
);
app.post("/api/products/import", upload.any(), (_req, res) =>
  res.json({ imported: 0 }),
);

app.get("/api/products/inventory/alerts", ensureAdmin, (req, res) => {
  const limit = Number(req.query.limit || 10);
  const products = state.products
    .filter((product) => product.stock <= (product.lowStockThreshold || 5))
    .slice(0, limit)
    .map(normalizeProduct);
  res.json({ products: clone(products), totalAlerts: products.length });
});

app.get("/api/products/:id", (req, res) => {
  const product = state.products.find((entry) => entry._id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(clone(normalizeProduct(product)));
});

app.get("/api/products", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const limit =
    req.query.limit === "all"
      ? state.products.length
      : Number(req.query.limit || state.products.length);
  let products = [...state.products];
  if (q) {
    products = products.filter((product) =>
      product.name.toLowerCase().includes(q),
    );
  }
  const sort = req.query.sort;
  if (sort === "best_selling") {
    products.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  } else if (sort === "name_asc") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }
  const page = Number(req.query.page || 1);
  const start = (page - 1) * limit;
  const paged = products.slice(start, start + limit).map(normalizeProduct);
  res.json({
    products: clone(paged),
    totalPages: Math.max(1, Math.ceil(products.length / limit)),
    currentPage: page,
    totalCount: products.length,
    total: products.length,
  });
});

app.post("/api/products", ensureAdmin, (req, res) => {
  const price = Number(req.body.price || 0);
  const costPrice =
    req.body.costPrice !== undefined ? Number(req.body.costPrice) : undefined;
  if (costPrice !== undefined && price < costPrice) {
    return res
      .status(400)
      .json({ message: "Giá bán lẻ không được nhỏ hơn giá nhập (giá vốn)" });
  }

  const brand =
    state.brands.find((entry) => entry._id === req.body.brand) ||
    state.brands[0];
  const category =
    state.categories.find((entry) => entry._id === req.body.categoryId) ||
    state.categories[0];
  const product = makeProduct(brand, category, {
    name: req.body.name,
    description: req.body.description || "",
    price: price,
    costPrice: costPrice,
    image: req.body.image || baseProduct.image,
    stock: Number(req.body.stock || 0),
    lowStockThreshold: Number(req.body.lowStockThreshold || 5),
    brand: brand ? { _id: brand._id, name: brand.name } : req.body.brand,
    categoryId: category?._id,
    category: category?.name,
    type: req.body.type || "automatic",
  });
  state.products.push(product);
  res.status(201).json(clone(product));
});

app.put("/api/products/:id", ensureAdmin, (req, res) => {
  const product = state.products.find((entry) => entry._id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  Object.assign(product, req.body, { updatedAt: nowIso() });
  res.json(clone(normalizeProduct(product)));
});

app.patch("/api/products/:id", ensureAdmin, (req, res) => {
  const product = state.products.find((entry) => entry._id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  product.isFeatured = !product.isFeatured;
  res.json({ isFeatured: product.isFeatured });
});

app.patch("/api/products", ensureAdmin, (req, res) => {
  if (req.body.action === "adjustPrice") {
    const ids = req.body.ids || [];
    if (
      !ids.length ||
      !state.products.some((product) => ids.includes(product._id))
    ) {
      return res.status(400).json({ message: "No valid products" });
    }
    const value = Number(req.body.value || 0);
    state.products = state.products.map((product) =>
      ids.includes(product._id)
        ? { ...product, price: Math.max(0, product.price + value) }
        : product,
    );
  }
  res.json({ success: true });
});

app.delete("/api/products/:id", ensureAdmin, (req, res) => {
  state.products = state.products.filter(
    (entry) => entry._id !== req.params.id,
  );
  res.json({ success: true });
});

app.get("/api/campaigns", (_req, res) => res.json(clone(state.campaigns)));
app.get("/api/campaigns/active", (_req, res) =>
  res.json(clone(state.campaigns.filter((entry) => entry.isActive))),
);
app.post("/api/campaigns", ensureAdmin, (req, res) => {
  const campaign = {
    _id: nextId("campaign"),
    name: req.body.name,
    group: req.body.group,
    discountPercentage: Number(req.body.discountPercentage),
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    isGlobal: !!req.body.isGlobal,
    status: "Active",
    isActive: true,
  };
  state.campaigns.unshift(campaign);
  res.status(201).json(clone(campaign));
});
app.patch("/api/campaigns/:id", ensureAdmin, (req, res) => {
  const campaign = state.campaigns.find((entry) => entry._id === req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  campaign.isActive = !campaign.isActive;
  campaign.status = campaign.isActive ? "Active" : "Paused";
  res.json(clone(campaign));
});
app.delete("/api/campaigns/:id", ensureAdmin, (req, res) => {
  state.campaigns = state.campaigns.filter(
    (entry) => entry._id !== req.params.id,
  );
  res.json({ success: true });
});

app.get("/api/banners", (_req, res) => res.json(clone(state.banners)));
app.post("/api/banners", ensureAdmin, (req, res) => {
  const banner = {
    _id: nextId("banner"),
    title: req.body.title || "Untitled",
    image: req.body.image || "",
    imageUrl: req.body.image || "",
    status: "ACTIVE",
    uploadedAt: nowIso(),
  };
  state.banners.unshift(banner);
  res.status(201).json(clone(banner));
});
app.patch("/api/banners/:id/toggle", ensureAdmin, (req, res) => {
  const banner = state.banners.find((entry) => entry._id === req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  banner.status = banner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  res.json(clone(banner));
});
app.delete("/api/banners/:id", ensureAdmin, (req, res) => {
  state.banners = state.banners.filter((entry) => entry._id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/cart", ensureAuth, (req, res) => {
  res.json(clone(getCartForUser(req.user._id)));
});
app.post("/api/cart/merge", ensureAuth, (req, res) => {
  const cart = getCartForUser(req.user._id);
  for (const item of req.body.guestCartItems || []) {
    cart.push(item);
  }
  res.json({ success: true });
});
app.post("/api/cart", ensureAuth, (req, res) => {
  const product = state.products.find(
    (entry) => entry._id === req.body.productId,
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  const cart = getCartForUser(req.user._id);
  const existing = cart.find((item) => item.product?._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product: clone(normalizeProduct(product)),
      quantity: 1,
      price: product.price,
      wristSize: req.body.wristSize || null,
      selectedColor: req.body.selectedColor || null,
      selectedSize: req.body.selectedSize || null,
    });
  }
  res.json({ success: true });
});
app.put("/api/cart/:productId", ensureAuth, (req, res) => {
  const cart = getCartForUser(req.user._id);
  const item = cart.find(
    (entry) => entry.product?._id === req.params.productId,
  );
  if (item) item.quantity = Number(req.body.quantity || item.quantity);
  res.json({ success: true });
});
app.put("/api/cart/:productId/options", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.delete("/api/cart", ensureAuth, (req, res) => {
  if (!req.body?.productId) {
    state.carts[req.user._id] = [];
  } else {
    state.carts[req.user._id] = getCartForUser(req.user._id).filter(
      (entry) => entry.product?._id !== req.body.productId,
    );
  }
  res.json({ success: true });
});

app.get("/api/coupons", (_req, res) => res.json(clone(state.coupons)));
app.post("/api/coupons/validate", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Coupon code required" });

  const coupon = state.coupons.find(
    (c) => c.code?.toUpperCase() === code.toUpperCase(),
  );
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  if (!coupon.isActive) {
    return res.status(400).json({ message: "Coupon is inactive" });
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ message: "Coupon has expired" });
  }

  res.json(clone(coupon));
});
app.post("/api/coupons", ensureAdmin, (req, res) => {
  const coupon = {
    _id: nextId("coupon"),
    code: req.body.code,
    discountPercentage: Number(
      req.body.discountPercentage || req.body.discount || 0,
    ),
    isActive: true,
    expiresAt: req.body.expirationDate || req.body.expiryDate || nowIso(),
  };
  state.coupons.unshift(coupon);
  res.status(201).json(clone(coupon));
});
app.patch("/api/coupons/:id/toggle", ensureAdmin, (req, res) => {
  const coupon = state.coupons.find((entry) => entry._id === req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  coupon.isActive = !coupon.isActive;
  res.json(clone(coupon));
});
app.delete("/api/coupons/:id", ensureAdmin, (req, res) => {
  state.coupons = state.coupons.filter((entry) => entry._id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/orders", ensureAdmin, (req, res) => {
  const status = req.query.status;
  const search = String(req.query.search || "").toLowerCase();
  let orders = [...state.orders];
  if (status) orders = orders.filter((order) => order.status === status);
  if (search) {
    orders = orders.filter(
      (order) =>
        order.orderCode.toLowerCase().includes(search) ||
        order.shippingDetails.fullName.toLowerCase().includes(search),
    );
  }
  const limit =
    req.query.limit === "all" ? orders.length : Number(req.query.limit || 10);
  const page = Number(req.query.page || 1);
  const start = (page - 1) * limit;
  const paged = orders.slice(start, start + limit);
  res.json({
    orders: clone(paged),
    pagination: {
      totalPages: Math.max(1, Math.ceil(orders.length / limit)),
      totalOrders: orders.length,
      currentPage: page,
    },
    stats: {
      pendingCount: state.orders.filter((order) => order.status === "pending")
        .length,
      returnedCount: state.orders.filter((order) => order.status === "returned")
        .length,
      totalOrders: state.orders.length,
    },
  });
});

app.get("/api/orders/my-orders", ensureAuth, (req, res) => {
  res.json(
    clone(state.orders.filter((order) => order.user._id === req.user._id)),
  );
});

app.get("/api/orders/track/:trackingToken", (_req, res) => {
  res.json(clone(state.orders[0]));
});

app.get("/api/orders/:id", (_req, res) => {
  res.json(clone(state.orders[0]));
});

app.patch("/api/orders/:id/status", ensureAdmin, (req, res) => {
  const order = state.orders.find((entry) => entry._id === req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.status = req.body.status || order.status;
  res.json(clone(order));
});

app.patch("/api/orders/:id/details", ensureAdmin, (req, res) => {
  const order = state.orders.find((entry) => entry._id === req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  Object.assign(order, req.body);
  res.json(clone(order));
});

app.post("/api/orders/cod", (req, res) => {
  const { items, products, shippingDetails } = req.body;
  const user = getCurrentUser(req);

  // Check stock first to prevent overselling
  const checkItems = items || products || [];
  for (const item of checkItems) {
    const prodId =
      typeof item.product === "object" ? item.product._id : item.product;
    const dbProduct = state.products.find((p) => p._id === prodId);
    if (dbProduct && (item.quantity || 1) > dbProduct.stock) {
      return res.status(400).json({
        message: `Sản phẩm ${dbProduct.name} chỉ còn ${dbProduct.stock} sản phẩm trong kho.`,
      });
    }
  }

  const orderItems = (items || products || []).map((item) => {
    const prodId =
      typeof item.product === "object" ? item.product._id : item.product;
    const dbProduct =
      state.products.find((p) => p._id === prodId) || baseProduct;
    return {
      product: clone(normalizeProduct(dbProduct)),
      quantity: item.quantity || 1,
      price: item.price || dbProduct.price || 0,
    };
  });

  // Calculate totals realistically to match backend business logic
  let subtotal = 0;
  for (const item of orderItems) {
    let p = item.product;
    let priceVal = p.price;
    const activeCampaign = state.campaigns.find(
      (c) => c.isActive && c.isGlobal,
    );
    if (activeCampaign) {
      priceVal = priceVal * (1 - activeCampaign.discountPercentage / 100);
    }
    subtotal += priceVal * item.quantity;
  }

  let discount = 0;
  if (req.body.coupon) {
    const cp = state.coupons.find(
      (c) =>
        c.code?.toUpperCase() === req.body.coupon?.toUpperCase() && c.isActive,
    );
    if (cp) {
      discount = subtotal * (cp.discountPercentage / 100);
    }
  }

  let finalTotal = Math.max(0, subtotal - discount);
  let shippingFee = 0;
  if (orderItems.length > 0) {
    if (finalTotal < 5000000) {
      const city = (shippingDetails?.city || "").toLowerCase().trim();
      const isBigCity = [
        "hà nội",
        "ha noi",
        "hanoi",
        "hn",
        "hồ chí minh",
        "ho chi minh",
        "hochiminh",
        "hcm",
        "tp.hcm",
        "tp hcm",
        "sài gòn",
        "sai gon",
      ].includes(city);
      shippingFee = isBigCity ? 30000 : 50000;
    }
  }

  let calculatedTotal = finalTotal + shippingFee;
  if (orderItems.length > 0) {
    calculatedTotal = Math.max(10000, calculatedTotal);
  }

  const order = {
    _id: nextId("order"),
    orderCode: `ORD${String(seq).padStart(4, "0")}`,
    user: user ? { _id: user._id, name: user.name, email: user.email } : null,
    products: orderItems,
    shippingDetails: {
      fullName: shippingDetails?.fullName || "Guest",
      phone:
        shippingDetails?.phone || shippingDetails?.phoneNumber || "0900000000",
      address: shippingDetails?.address || "123 Mock Street",
      city: shippingDetails?.city || "Ho Chi Minh",
      district: shippingDetails?.district || "",
      ward: shippingDetails?.ward || "",
    },
    totalAmount: calculatedTotal,
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    status: "pending",
    currency: "VND",
    createdAt: nowIso(),
  };
  state.orders.push(order);
  res.status(201).json(order);
});

app.post("/api/orders/lookup", (_req, res) => res.json(clone(state.orders[0])));
app.patch("/api/orders/:id/cancel", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.patch("/api/orders/:id/request-return", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.post("/api/orders/qr", ensureAuth, (_req, res) =>
  res.json({ orderId: state.orders[0]._id, qrCode: "mock-qr-code" }),
);
app.post("/api/orders/:id/confirm-qr-payment", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);

app.get("/api/inventory/low-stock", ensureAdmin, (_req, res) => {
  const products = state.products
    .filter((product) => product.stock <= (product.lowStockThreshold || 5))
    .map(normalizeProduct);
  res.json(clone(products));
});
app.get("/api/inventory/product/:productId", ensureAdmin, (req, res) => {
  res.json(clone(state.inventoryLogs[req.params.productId] || []));
});
app.post("/api/inventory/adjust", ensureAdmin, (req, res) => {
  const product = state.products.find(
    (entry) => entry._id === req.body.productId,
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  const quantity = Number(req.body.quantity || 0);
  if (req.body.action === "IN") product.stock += quantity;
  else if (req.body.action === "OUT")
    product.stock = Math.max(0, product.stock - quantity);
  else product.stock = quantity;
  const log = {
    _id: nextId("inv"),
    action: req.body.action,
    quantity,
    note: req.body.note || "",
    createdAt: nowIso(),
    userId: { email: req.user.email },
  };
  state.inventoryLogs[product._id] = [
    log,
    ...(state.inventoryLogs[product._id] || []),
  ];
  res.json(clone({ success: true, product }));
});

app.get("/api/mail/stats", ensureAdmin, (_req, res) =>
  res.json(clone(state.mail.stats)),
);
app.get("/api/mail/inbox", ensureAdmin, (_req, res) =>
  res.json(clone(state.mail.inbox)),
);
app.get("/api/mail/subscribers", ensureAdmin, (_req, res) =>
  res.json(clone(state.mail.subscribers)),
);
app.get("/api/mail/campaigns", ensureAdmin, (_req, res) =>
  res.json(clone(state.mail.campaigns)),
);
app.get("/api/mail/templates", ensureAdmin, (_req, res) =>
  res.json(clone(state.mail.templates)),
);
app.delete("/api/mail/subscribers/:id", ensureAdmin, (req, res) => {
  state.mail.subscribers = state.mail.subscribers.filter(
    (entry) => entry._id !== req.params.id,
  );
  res.json({ success: true });
});
app.patch("/api/mail/automations/:id/toggle", ensureAdmin, (_req, res) =>
  res.json({ success: true }),
);
app.post("/api/mail/subscribe", (_req, res) => res.json({ success: true }));

app.get("/api/reviews", ensureAdmin, (_req, res) =>
  res.json(clone(state.reviews)),
);

app.get("/api/reviews/product/:productId", (req, res) => {
  const filtered = state.reviews.filter((r) => {
    const pId = typeof r.product === "object" ? r.product._id : r.productId;
    return pId === req.params.productId && r.status === "approved";
  });
  res.json({ reviews: clone(filtered) });
});

app.post("/api/reviews/product/:productId", ensureAuth, (req, res) => {
  const product = state.products.find(
    (entry) => entry._id === req.params.productId,
  );
  if (!product) return res.status(404).json({ message: "Product not found" });

  const review = {
    _id: nextId("review"),
    user: { _id: req.user._id, name: req.user.name },
    userName: req.user.name,
    product: { _id: product._id, name: product.name },
    productId: product._id,
    productName: product.name,
    rating: Number(req.body.rating || 5),
    comment: req.body.comment || "",
    status: "pending",
    createdAt: nowIso(),
  };
  state.reviews.push(review);
  res.status(201).json(review);
});

app.patch("/api/reviews/:id/status", ensureAdmin, (req, res) => {
  const review = state.reviews.find((entry) => entry._id === req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  review.status = req.body.status || review.status;
  res.json(clone(review));
});

app.delete("/api/reviews/:id", ensureAuth, (req, res) => {
  const reviewIndex = state.reviews.findIndex(
    (entry) => entry._id === req.params.id,
  );
  if (reviewIndex === -1)
    return res.status(404).json({ message: "Review not found" });

  const review = state.reviews[reviewIndex];

  // Non-admins can only delete their own reviews
  if (
    req.user.role !== "admin" &&
    String(review.user?._id) !== String(req.user._id)
  ) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this review" });
  }

  state.reviews.splice(reviewIndex, 1);
  res.json({ success: true });
});

app.get("/api/questions", ensureAdmin, (_req, res) =>
  res.json(clone(state.questions)),
);
app.post("/api/questions/:id/reply", ensureAdmin, (req, res) => {
  const question = state.questions.find((entry) => entry._id === req.params.id);
  if (question) question.answer = req.body.answer || "";
  res.json(clone(question));
});

app.post("/api/ai/automation/confirm-orders", ensureAdmin, (_req, res) =>
  res.json({ message: "AI confirm orders done" }),
);
app.post("/api/ai/automation/cleanup-users", ensureAdmin, (_req, res) =>
  res.json({ message: "AI cleanup users done" }),
);
app.post("/api/ai/chat", (_req, res) =>
  res.json({ message: "Mock AI response" }),
);

app.post("/api/contact", (_req, res) => res.json({ success: true }));
app.get("/api/wishlist", ensureAuth, (_req, res) => res.json([]));
app.post("/api/wishlist", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.delete("/api/wishlist/:id", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.post("/api/wishlist/merge", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);

app.post("/api/payments/create-checkout-session", ensureAuth, (_req, res) =>
  res.json({ url: "http://localhost:5173/purchase-success" }),
);
app.post("/api/payments/checkout-success", ensureAuth, (_req, res) =>
  res.json({ success: true }),
);
app.post("/api/payments/verify-return", (_req, res) =>
  res.json({ status: "success" }),
);

app.use((_req, res) => {
  res.status(404).json({ message: "Mock route not implemented" });
});

app.listen(PORT, () => {
  console.log(`[mock-e2e] listening on http://localhost:${PORT}`);
});
