import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";
import CampaignService from "../services/campaign.service.js";

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(value));

const getProductBrandName = (brand) => {
  if (!brand) return "Không rõ";
  if (typeof brand === "string") return brand;
  return brand.name || brand.title || "Không rõ";
};

// ═══════════════════════════════════════════════════════════════
// AI Provider Selection: Groq > Gemini > Fallback Bot
// ═══════════════════════════════════════════════════════════════

const getAIClient = () => {
  // Priority 1: Groq (fast, cheap)
  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      client: new Groq({ apiKey: process.env.GROQ_API_KEY }),
      model: "llama-3.3-70b-versatile",
    };
  }
  // Priority 2: Google Gemini
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY),
      model: "gemini-2.0-flash",
    };
  }
  return null;
};

const callAI = async (systemPrompt, userMessage, jsonMode = false) => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    if (ai.provider === "groq") {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ];
      const completion = await ai.client.chat.completions.create({
        model: ai.model,
        messages,
        temperature: 0.2,
        max_tokens: jsonMode ? 150 : 300,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      });
      return completion.choices[0]?.message?.content?.trim() || "";
    }

    if (ai.provider === "gemini") {
      const model = ai.client.getGenerativeModel({
        model: ai.model,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 20,
          maxOutputTokens: jsonMode ? 150 : 300,
        },
      });
      const result = await model.generateContent(
        `${systemPrompt}\n\n${userMessage}`,
      );
      return result.response.text().trim();
    }
  } catch (err) {
    const isGeminiQuotaError =
      ai.provider === "gemini" &&
      /429|quota|rate limit|too many requests/i.test(err?.message || "");

    if (!isGeminiQuotaError) {
      console.error(`[AI ${ai.provider}] Error:`, err.message);
    }
  }
  return null;
};

const parseBudgetRange = (message) => {
  const normalized = (message || "")
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");
  const currencyMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/,
  );

  if (!currencyMatch) return null;

  const amount = Number(currencyMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const valueInVnd = Math.round(amount * 1_000_000);

  // Support "từ 5 đến 15 triệu"
  const rangeMatch = normalized.match(
    /(?:từ|from)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)?\s*(?:đến|tới|to|-)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/,
  );
  if (rangeMatch) {
    const minUnit = 1_000_000;
    const maxUnit = 1_000_000;
    return {
      minPrice: Math.round(Number(rangeMatch[1]) * minUnit),
      maxPrice: Math.round(Number(rangeMatch[3]) * maxUnit),
      label: `từ ${rangeMatch[1]} đến ${rangeMatch[3]} triệu`,
    };
  }

  const hasBelowIntent =
    normalized.includes("dưới") ||
    normalized.includes("tối đa") ||
    normalized.includes("không quá") ||
    normalized.includes("under") ||
    normalized.includes("less than") ||
    normalized.includes("<=") ||
    normalized.includes("≤") ||
    normalized.includes("thôi") ||
    normalized.includes("chỉ");
  const hasAboveIntent =
    normalized.includes("trên") ||
    normalized.includes("tối thiểu") ||
    normalized.includes("trở lên") ||
    normalized.includes("over") ||
    normalized.includes("more than") ||
    normalized.includes(">=") ||
    normalized.includes("≥") ||
    (normalized.includes("từ") &&
      !normalized.includes("đến") &&
      !normalized.includes("tới") &&
      !normalized.includes("-"));
  const hasApproxIntent =
    normalized.includes("khoảng") ||
    normalized.includes("tầm") ||
    normalized.includes("around") ||
    normalized.includes("about") ||
    normalized.includes("~");

  if (hasBelowIntent) {
    return { maxPrice: valueInVnd, label: `dưới ${currencyMatch[1]} triệu` };
  }

  if (hasAboveIntent) {
    return { minPrice: valueInVnd, label: `trên ${currencyMatch[1]} triệu` };
  }

  if (hasApproxIntent) {
    return {
      minPrice: Math.round(valueInVnd * 0.85),
      maxPrice: Math.round(valueInVnd * 1.15),
      label: `khoảng ${currencyMatch[1]} triệu`,
    };
  }

  // Default: treat as maximum limit (e.g. "đồng hồ 10 triệu", "có 10 triệu")
  return { maxPrice: valueInVnd, label: `dưới ${currencyMatch[1]} triệu` };
};

const fetchBudgetMatches = async (budget) => {
  const rawProducts = await Product.find({ deletedAt: null, isActive: true })
    .select(
      "name brand type price stock description customAttributes specs category",
    )
    .populate("brand", "name")
    .sort({ salesCount: -1 })
    .limit(100)
    .lean();

  if (!rawProducts.length) return [];

  const products = await CampaignService.applyCampaignToProducts(rawProducts);
  return products
    .filter((product) => {
      const price = Number(product.price || 0);
      if (!price) return false;
      if (budget.minPrice != null && price < budget.minPrice) return false;
      if (budget.maxPrice != null && price > budget.maxPrice) return false;
      return true;
    })
    .sort((a, b) => (a.price || 0) - (b.price || 0));
};

const formatBudgetResponse = (matches, budget) => {
  if (!matches.length) {
    const limitText = budget.maxPrice
      ? `${formatVnd(budget.maxPrice)}đ`
      : `${formatVnd(budget.minPrice)}đ trở lên`;
    return `Hiện tại chưa có sản phẩm phù hợp ${budget.label}. Bạn có thể xem Catalog để lọc theo mức giá gần nhất quanh ${limitText}.`;
  }

  const topMatches = matches.slice(0, 5).map((product) => {
    const brandName = getProductBrandName(product.brand);
    return `- ${brandName} ${product.name}: ${formatVnd(product.price)}đ${product.stock > 0 ? `, còn ${product.stock} chiếc` : ", hết hàng"}`;
  });

  return `Mình tìm được ${matches.length} sản phẩm phù hợp ${budget.label}:\n${topMatches.join("\n")}\n\nBạn muốn mình lọc tiếp theo kiểu máy, thương hiệu hay màu dây không?`;
};

const parseRequestedCount = (message) => {
  const normalized = (message || "").toLowerCase();
  const match =
    normalized.match(
      /(\d+)\s*(?:sản phẩm|sp|mẫu|chiếc|cái|món|item|đơn|cái)/,
    ) ||
    normalized.match(/(?:hiện|show|lấy|gợi ý|top|chọn)\s*(\d+)/) ||
    normalized.match(/(\d+)\s*(?:mẫu|cái)/);

  if (match) {
    const count = parseInt(match[1], 10);
    if (!isNaN(count) && count >= 1) {
      return Math.min(count, 5); // maximum 5
    }
  }
  return 3; // default is 3
};

const mapProductForChat = (product) => {
  return {
    id: product._id,
    slug: product.slug,
    slugToken: product.slugToken,
    name: product.name,
    brand: getProductBrandName(product.brand),
    price: Number(product.price || 0),
    stock: product.stock || 0,
    averageRating: Number(product.averageRating || 0),
    salesCount: Number(product.salesCount || 0),
    image: product.image,
  };
};

const fetchChatMatchingProducts = async (message, limit = 3) => {
  try {
    const budget = parseBudgetRange(message);
    const normalized = (message || "")
      .toLowerCase()
      .replace(/,/g, ".")
      .replace(/\s+/g, " ");

    // Build a query
    const query = { deletedAt: null, isActive: true };

    // Apply budget filters
    if (budget) {
      if (budget.minPrice != null || budget.maxPrice != null) {
        query.price = {};
        if (budget.minPrice != null) query.price.$gte = budget.minPrice;
        if (budget.maxPrice != null) query.price.$lte = budget.maxPrice;
      }
    }

    // Apply brand filters if brand is mentioned
    const brands = [
      "rolex",
      "omega",
      "tudor",
      "seiko",
      "casio",
      "longines",
      "patek philippe",
      "hublot",
      "cartier",
      "tissot",
    ];
    const matchedBrand = brands.find((b) => normalized.includes(b));
    if (matchedBrand) {
      const brandDoc = await Brand.findOne({
        name: new RegExp(`^${matchedBrand}$`, "i"),
      }).lean();
      if (brandDoc) {
        query.brand = brandDoc._id;
      } else {
        const brandDocPartial = await Brand.findOne({
          name: new RegExp(matchedBrand, "i"),
        }).lean();
        if (brandDocPartial) {
          query.brand = brandDocPartial._id;
        } else {
          query.brand = new RegExp(matchedBrand, "i");
        }
      }
    }

    // Apply gender / category filters
    if (
      normalized.includes("nữ") ||
      normalized.includes("female") ||
      normalized.includes("lady") ||
      normalized.includes("ladies")
    ) {
      query.$or = [
        { category: /nữ/i },
        { name: /nữ|lady|ladies|ltp/i },
        { description: /nữ/i },
      ];
    } else if (
      normalized.includes("nam") ||
      normalized.includes("male") ||
      normalized.includes("men")
    ) {
      query.$or = [
        { category: /nam/i },
        { name: /nam|men/i },
        { description: /nam/i },
      ];
    }

    const rawProducts = await Product.find(query)
      .select(
        "name brand type price stock description customAttributes specs category image slug slugToken averageRating salesCount",
      )
      .populate("brand", "name")
      .sort({ salesCount: -1 })
      .limit(limit)
      .lean();

    return await CampaignService.applyCampaignToProducts(rawProducts);
  } catch (err) {
    console.error("⚠️ Error fetching chat matching products:", err.message);
    return [];
  }
};

// --- Lấy danh sách sản phẩm từ DB hoặc pre-filtered để inject vào prompt ---
const buildProductContext = async (preFilteredProducts = null) => {
  try {
    let products = preFilteredProducts;
    if (!products) {
      const rawProducts = await Product.find({
        deletedAt: null,
        isActive: true,
      })
        .select(
          "name brand type price stock description customAttributes specs category",
        )
        .populate("brand", "name")
        .sort({ salesCount: -1 })
        .limit(60)
        .lean();

      if (!rawProducts || rawProducts.length === 0) return "";
      products = await CampaignService.applyCampaignToProducts(rawProducts);
    }

    if (!products || products.length === 0) {
      return "\n\n📦 Hiện tại cửa hàng chưa có sản phẩm nào phù hợp với tầm giá/yêu cầu này.";
    }

    const typeLabel = {
      mechanical: "Cơ lên cót tay",
      quartz: "Máy pin",
      automatic: "Cơ tự động",
      solar: "Năng lượng ánh sáng",
    };

    const lines = products.map((p) => {
      let priceStr = p.price
        ? p.price.toLocaleString("vi-VN") + "đ"
        : "Liên hệ";
      let rawPrice = p.price || 0;
      let millionPrice = p.price
        ? (p.price / 1_000_000).toFixed(2).replace(/\.00$/, "") + " triệu"
        : "";

      if (p.originalPrice && p.price < p.originalPrice) {
        priceStr = `ĐANG SALE [${p.activeCampaignName || "Flash Sale"}]: ${p.price.toLocaleString("vi-VN")}đ (Gốc: ${p.originalPrice.toLocaleString("vi-VN")}đ)`;
      }

      const stockStr = p.stock > 0 ? `Còn hàng (${p.stock} chiếc)` : "Hết hàng";
      const typeStr = typeLabel[p.type] || p.type;

      // Thuộc tính bổ sung
      const extras = [];
      if (p.specs?.waterResistance)
        extras.push(`Chống nước: ${p.specs.waterResistance}`);
      if (p.specs?.caseMaterial) extras.push(`Vỏ: ${p.specs.caseMaterial}`);
      if (p.specs?.glass) extras.push(`Kính: ${p.specs.glass}`);
      if (p.customAttributes?.length) {
        p.customAttributes.forEach((a) => extras.push(`${a.name}: ${a.value}`));
      }

      return `- [${getProductBrandName(p.brand)}] ${p.name} | Loại: ${typeStr} | Giá: ${priceStr} (${millionPrice} - ${rawPrice}đ) | ${stockStr}${extras.length ? " | " + extras.join(", ") : ""}`;
    });

    return (
      `\n\n📦 DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI CỬA HÀNG KHỚP VỚI YÊU CẦU (${products.length} sản phẩm):\n` +
      lines.join("\n")
    );
  } catch (err) {
    console.error("⚠️ Không thể tải danh sách sản phẩm cho AI:", err.message);
    return "";
  }
};

// --- Prompt gốc của AI ---
const BASE_SYSTEM_PROMPT = `
Bạn là trợ lý ảo thông minh, chuyên nghiệp và lịch sự của Luxury Watch - cửa hàng chuyên bán đồng hồ chính hãng cao cấp.
Nhiệm vụ chính của bạn là tư vấn sản phẩm, hỗ trợ dịch vụ và chốt đơn hàng dựa trên danh sách dữ liệu được cung cấp dưới đây.

THÔNG TIN CỬA HÀNG:
- Phạm vi kinh doanh: Chỉ bán các sản phẩm đồng hồ đeo tay cao cấp chính hãng mới. TUYỆT ĐỐI không bán đồng hồ thông minh (smartwatch / Apple Watch), không bán đồng hồ treo tường, không bán các loại linh kiện/phụ kiện/dây đeo riêng lẻ và KHÔNG làm dịch vụ sửa chữa, bảo dưỡng hay thay kính đồng hồ.
- Chính sách bảo hành: 5 năm toàn cầu cho tất cả sản phẩm chính hãng.
- Giao hàng: Chỉ giao hàng hỏa tốc nội thành 2–4h, toàn quốc tiêu chuẩn 1–2 ngày, miễn phí (Chỉ trong phạm vi Việt Nam, TUYỆT ĐỐI không ship COD ra nước ngoài hay Nhật Bản).
- Thanh toán: Thẻ quốc tế (Stripe), VNPay, COD.
- Đổi trả: 1 đổi 1 trong 30 ngày nếu còn nguyên seal, chưa qua sử dụng.
- Hotline: 1900 6789.

QUY TẮC ỨNG XỬ VÀ HƯỚNG DẪN TRẢ LỜI (CỰC KỲ QUAN TRỌNG):

1. CÁCH SO SÁNH GIÁ: Mỗi sản phẩm trong danh sách dưới đây đều được hiển thị kèm theo giá trị triệu và số học thô không dấu chấm (ví dụ: "4.37 triệu - 4370000đ"). Khi khách hàng đưa ra một mức giá hoặc khoảng giá, bạn bắt buộc phải so sánh bằng toán học số thô này (ví dụ: so sánh 4370000đ với 10000000đ). Tuyệt đối không bao giờ gợi ý sản phẩm vượt quá ngân sách của khách. Không được nhầm lẫn giữa các con số tương tự nhau (ví dụ: 4.37 triệu và 43.7 triệu).

2. QUY TẮC PHỦ ĐỊNH & TRÁNH NÓI BỪA (HALLUCINATION GATING):
   - Nếu khách hàng hỏi về một sản phẩm, một mã sản phẩm hoặc thương hiệu KHÔNG có trong danh sách dữ liệu truyền vào, hãy lịch sự xác nhận là hệ thống cửa hàng hiện chưa có sản phẩm đó.
   - Tuyệt đối KHÔNG bịa đặt thông tin, giá cả hoặc sản phẩm không có thật.

3. TƯ DUY KINH DOANH & GỢI Ý THAY THẾ (ALTERNATIVE GATING):
   - Thay vì chỉ từ chối thẳng thừng, hãy khéo léo gợi ý các sản phẩm khác ĐANG SẴN CÓ trong danh sách có cùng phân khúc giá, phong cách tương đương (nam/nữ, dây da/dây kim loại, automatic/pin) hoặc cùng tầm thương hiệu để thuyết phục khách hàng.
   - Ví dụ: Khách hỏi Rolex giá 2 triệu (Rolex không có tầm giá đó), hãy lịch sự tư vấn các dòng Casio hoặc Seiko chính hãng cực đẹp tầm dưới 2 triệu đang sẵn có tại cửa hàng.

4. GIỮ ĐÚNG PHẠM VI HỖ TRỢ (SCOPE GATING):
   - Nếu khách hàng hỏi những câu hỏi ngoài lề không liên quan đến đồng hồ, mua hàng, bảo hành hay dịch vụ của shop (như thời tiết, nấu ăn, lập trình,...), hãy lịch sự nhắc nhở khéo léo rằng vai trò của bạn là trợ lý tư vấn đồng hồ của shop và kéo họ quay lại chủ đề đồng hồ.

5. TONE GIỌNG & NGÔN NGỮ:
   - Xưng hô "Dạ/Em", lịch sự, thân thiện, sành điệu, có tư duy bán hàng thực tế (Business Mindset).
   - Trả lời ngắn gọn, trực diện, đi thẳng vào vấn đề và giữ độ dài dưới 150 chữ.

6. QUY TẮC HIỂN THỊ SẢN PHẨM & TRÁNH TRÙNG LẶP (CỰC KỲ QUAN TRỌNG):
   - Cửa hàng đã có giao diện tự động vẽ các Thẻ Sản Phẩm Tương Tác từ dữ liệu JSON gửi kèm.
   - Do đó, trong câu trả lời văn bản của bạn, **TUYỆT ĐỐI KHÔNG** được liệt kê lại tên sản phẩm, thông số kỹ thuật hoặc giá tiền bằng chữ để tránh việc giao diện bị lặp dữ liệu hai lần.
   - **Khi khách hàng yêu cầu tìm kiếm, gợi ý sản phẩm hoặc hỏi về tầm giá/thương hiệu**:
     - Nếu có sản phẩm phù hợp trong danh sách dữ liệu: Chỉ nhả ra đúng 1 câu cực kỳ ngắn gọn, đi thẳng vào vấn đề, không chào hỏi rườm rà hay hỏi ngược lại khách hàng. Dạng: "Luxury Watch đang sẵn các mẫu nổi bật dưới đây để bạn tham khảo:".
     - Nếu không có sản phẩm phù hợp: Trả lời ngắn gọn: "Hiện tại kho hàng chưa có mẫu đúng yêu cầu của bạn. Bạn muốn tìm tầm giá nào hoặc thương hiệu nào?".
   - **Khi khách hàng hỏi các câu hỏi dịch vụ (bảo hành, giao hàng, đổi trả, thanh toán, liên hệ...)**: Trả lời trực diện, ngắn gọn thông tin chính xác theo chính sách của cửa hàng, không dông dài.
`;

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp nội dung tin nhắn" });
    }

    // ── Step 1: Parse count limit & fetch matching products ──
    const requestedLimit = parseRequestedCount(message);
    const matchedProducts = await fetchChatMatchingProducts(
      message,
      requestedLimit,
    );

    // ── Step 2: Try AI (Gemini > Groq) ──
    const ai = getAIClient();
    if (ai) {
      try {
        // Feed the exactly matched products to the AI context so it aligns perfectly
        const productContext = await buildProductContext(matchedProducts);
        const fullSystemPrompt = BASE_SYSTEM_PROMPT + productContext;

        const aiResponse = await callAI(
          fullSystemPrompt,
          `Khách hàng: ${message}\nTrợ lý:`,
        );
        if (aiResponse) {
          return res.json({
            response: aiResponse,
            products: matchedProducts.map(mapProductForChat),
            suggestedProducts: matchedProducts.map(mapProductForChat),
            provider: ai.provider,
          });
        }
      } catch (aiErr) {
        console.error(`[AI ${ai.provider}] Chat error:`, aiErr.message);
      }
    }

    // ── Step 3: Fallback ──
    const budget = parseBudgetRange(message);
    if (budget && matchedProducts.length > 0) {
      return res.json({
        response: formatBudgetResponse(matchedProducts, budget),
        products: matchedProducts.map(mapProductForChat),
        suggestedProducts: matchedProducts.map(mapProductForChat),
        provider: "built-in",
      });
    }

    console.log("⚠️ No AI provider available. Using fallback bot.");
    return res.json({
      response: getFallbackBotResponse(message),
      provider: "fallback",
    });
  } catch (error) {
    console.error("AI Error:", error.message);
    return res.json({
      response: getFallbackBotResponse(req.body?.message || ""),
      provider: "fallback",
    });
  }
};

// --- 10đ Target.md: AI Automation ---
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

import OrderService from "../services/order.service.js";
import { emailQueue } from "./mail.controller.js";

export const confirmOrdersAI = async (req, res) => {
  try {
    const ai = getAIClient();
    if (!ai) {
      return res
        .status(500)
        .json({
          message:
            "Chưa cấu hình GROQ_API_KEY hoặc GEMINI_API_KEY để chạy AI Automation.",
        });
    }

    console.log(
      `🤖 [AI System] Analyzing pending orders using ${ai.provider}...`,
    );

    const pendingOrders = await Order.find({
      status: "pending",
      paymentMethod: "cod",
    }).populate("user");

    let confirmedCount = 0;
    let cancelledCount = 0;

    const ANALYSIS_PROMPT = `Bạn là hệ thống AI phân tích rủi ro đơn hàng thương mại điện tử.
Đánh giá xem đơn hàng sau có phải là đơn hàng ảo/spam không.
Các yếu tố rủi ro: tên người dùng chứa bot/test/admin/spam, số điện thoại không có thực, địa chỉ chuỗi vô nghĩa.
Trả về JSON: {"isSpam": true/false, "reason": "giải thích ngắn gọn tiếng Việt"}`;

    const providerLabel = ai.provider === "gemini" ? "Gemini" : "Groq";

    for (const order of pendingOrders) {
      const userPrompt = `Thông tin đơn hàng:
- Tên: ${order.shippingDetails?.fullName || order.user?.name || "Không rõ"}
- Email: ${order.shippingDetails?.email || order.user?.email || "Không rõ"}
- SĐT: ${order.shippingDetails?.phoneNumber || "Không rõ"}
- Địa chỉ: ${order.shippingDetails?.address || ""}, ${order.shippingDetails?.city || ""}
- Giá trị: ${order.totalAmount}đ`;

      try {
        const text = await callAI(ANALYSIS_PROMPT, userPrompt, true);
        if (!text) continue;

        const cleaned = text.replace(/```json|```/g, "").trim();
        const aiAnalysis = JSON.parse(cleaned);

        if (aiAnalysis.isSpam) {
          order.status = "cancelled";
          order.internalNotes =
            (order.internalNotes ? order.internalNotes + "\n" : "") +
            `[AI ${providerLabel}] Tự động hủy lúc ${new Date().toLocaleString("vi-VN")}: ${aiAnalysis.reason}`;

          // Thêm sự kiện tracking
          order.trackingEvents.push({
            status: "cancelled",
            message: "Hệ thống AI từ chối đơn hàng do nghi ngờ rủi ro/spam.",
            timestamp: new Date(),
          });

          await order.save();
          await OrderService.restoreStock(
            order.products,
            null,
            order._id,
            "AI tự động hủy: " + aiAnalysis.reason,
          );

          if (order.shippingDetails?.email) {
            await emailQueue.add("order-status-update", {
              email: order.shippingDetails.email,
              subject: "Đơn hàng của bạn đã bị hủy #" + order.orderCode,
              order: {
                orderCode: order.orderCode,
                status: "cancelled",
                trackingToken: order.trackingToken,
              },
            });
          }
          cancelledCount++;
        } else {
          order.status = "confirmed";
          order.internalNotes =
            (order.internalNotes ? order.internalNotes + "\n" : "") +
            `[AI ${providerLabel}] Xác nhận tự động lúc ${new Date().toLocaleString("vi-VN")}: ${aiAnalysis.reason}`;

          // Thêm sự kiện tracking
          order.trackingEvents.push({
            status: "confirmed",
            message: "Đơn hàng đã được xác nhận tự động bởi hệ thống.",
            timestamp: new Date(),
          });

          await order.save();

          if (order.shippingDetails?.email) {
            await emailQueue.add("order-status-update", {
              email: order.shippingDetails.email,
              subject: "Đơn hàng đã được xác nhận #" + order.orderCode,
              order: {
                orderCode: order.orderCode,
                status: "confirmed",
                trackingToken: order.trackingToken,
              },
            });
          }
          confirmedCount++;
        }
      } catch (aiErr) {
        console.error(
          "Lỗi khi gọi Gemini cho Order " + order._id + ":",
          aiErr.message,
        );
        // Skips order if AI fails, leaving it as pending
      }
    }

    res.json({
      success: true,
      message: `AI đã xử lý ${pendingOrders.length} đơn. Xác nhận: ${confirmedCount}, Hủy: ${cancelledCount}.`,
      confirmedCount,
      cancelledCount,
    });
  } catch (error) {
    console.error("AI Automation Error (Orders):", error.message);
    res.status(500).json({ message: "Lỗi hệ thống AI", error: error.message });
  }
};

export const cleanupUsersAI = async (req, res) => {
  try {
    console.log("🤖 [AI System] Scanning for invalid/spam users...");

    // Find customer users
    const users = await User.find({ role: "customer" });

    let count = 0;
    for (const user of users) {
      // AI Logic: Identify 'test' accounts or accounts with no orders and suspicious names
      const isTestName =
        /test|bot|demo|spam|fake|123/i.test(user.name) ||
        /test|bot|fake/i.test(user.email);

      if (isTestName) {
        // Check if user has orders before deleting
        const orderCount = await Order.countDocuments({ user: user._id });
        if (orderCount === 0) {
          await User.findByIdAndDelete(user._id);
          count++;
        }
      }
    }

    res.json({
      success: true,
      message: `AI đã phát hiện và dọn dẹp ${count} tài khoản người dùng không hợp lệ/spam.`,
      count,
    });
  } catch (error) {
    console.error("AI Automation Error (Users):", error.message);
    res.status(500).json({ message: "Lỗi hệ thống AI", error: error.message });
  }
};

// --- Fallback bot offline ---
const getFallbackBotResponse = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("rolex"))
    return "Rolex là thương hiệu đồng hồ Thụy Sĩ huyền thoại. Hiện cửa hàng có nhiều dòng Rolex chính hãng. Bạn vui lòng xem trang Catalog để biết tình trạng hàng và giá mới nhất!";
  if (lower.includes("omega"))
    return "Omega là thương hiệu đồng hồ Thụy Sĩ danh tiếng, đối tác chính thức của NASA. Khám phá bộ sưu tập Omega tại trang Catalog của chúng tôi!";
  if (lower.includes("giá") || lower.includes("bao nhiêu"))
    return "Cửa hàng có đồng hồ từ nhiều tầm giá khác nhau. Bạn có thể dùng bộ lọc giá trên trang Catalog để tìm sản phẩm phù hợp ngân sách!";
  if (lower.includes("bảo hành"))
    return "Tất cả sản phẩm được bảo hành chính hãng 5 năm. Bảo hành bao gồm sửa chữa và thay thế linh kiện chính hãng miễn phí.";
  if (lower.includes("giao hàng") || lower.includes("ship"))
    return "Giao hàng nội thành hỏa tốc 2–4h, toàn quốc 1–2 ngày làm việc, hoàn toàn miễn phí!";
  if (lower.includes("đổi") || lower.includes("trả"))
    return "Chính sách 1 đổi 1 trong 30 ngày nếu sản phẩm còn nguyên seal, chưa qua sử dụng.";
  if (lower.includes("thanh toán"))
    return "Cửa hàng hỗ trợ thanh toán thẻ quốc tế, VNPay và COD (thanh toán khi nhận hàng).";
  return "Cảm ơn bạn đã liên hệ Luxury Watch! Vui lòng gọi Hotline 1900 6789 hoặc duyệt trang Catalog để tìm sản phẩm phù hợp.";
};
