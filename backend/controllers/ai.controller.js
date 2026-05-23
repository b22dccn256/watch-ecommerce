import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Product from "../models/product.model.js";
import CampaignService from "../services/campaign.service.js";

const formatVnd = (value) => new Intl.NumberFormat("vi-VN").format(Math.round(value));

const getProductBrandName = (brand) => {
    if (!brand) return "Không rõ";
    if (typeof brand === "string") return brand;
    return brand.name || brand.title || "Không rõ";
};

// ═══════════════════════════════════════════════════════════════
// AI Provider Selection: Gemini > Groq > Fallback Bot
// ═══════════════════════════════════════════════════════════════

const getAIClient = () => {
    // Priority 1: Google Gemini
    if (process.env.GEMINI_API_KEY) {
        return {
            provider: "gemini",
            client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY),
            model: "gemini-2.0-flash",
        };
    }
    // Priority 2: Groq (fast, cheap)
    if (process.env.GROQ_API_KEY) {
        return {
            provider: "groq",
            client: new Groq({ apiKey: process.env.GROQ_API_KEY }),
            model: "llama-3.3-70b-versatile",
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
                generationConfig: { temperature: 0.2, topP: 0.8, topK: 20, maxOutputTokens: jsonMode ? 150 : 300 },
            });
            const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
            return result.response.text().trim();
        }
    } catch (err) {
        console.error(`[AI ${ai.provider}] Error:`, err.message);
    }
    return null;
};

const parseBudgetRange = (message) => {
    const normalized = (message || "").toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ");
    const currencyMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/);

    if (!currencyMatch) return null;

    const amount = Number(currencyMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) return null; // Fix: reject zero/negative

    const valueInVnd = Math.round(amount * 1_000_000); // Fix: avoid floating point issues
    const hasBelowIntent = normalized.includes("dưới") || normalized.includes("tối đa") || normalized.includes("không quá") || normalized.includes("under") || normalized.includes("less than") || normalized.includes("<=") || normalized.includes("≤");
    const hasApproxIntent = normalized.includes("khoảng") || normalized.includes("tầm") || normalized.includes("around") || normalized.includes("about") || normalized.includes("~");

    if (hasBelowIntent) {
        return { maxPrice: valueInVnd, label: `dưới ${currencyMatch[1]} triệu` };
    }

    // Fix: Support "từ 5 đến 15 triệu" (missing unit after first number)
    const rangeMatch = normalized.match(/(?:từ|from)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)?\s*(?:đến|tới|to|-)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/);
    if (rangeMatch) {
        const minUnit = rangeMatch[2] ? 1_000_000 : 1_000_000; // If unit missing after first number, still treat as triệu
        const maxUnit = rangeMatch[4] ? 1_000_000 : 1_000_000;
        return {
            minPrice: Math.round(Number(rangeMatch[1]) * minUnit),
            maxPrice: Math.round(Number(rangeMatch[3]) * maxUnit),
            label: `từ ${rangeMatch[1]} đến ${rangeMatch[3]} triệu`,
        };
    }

    // Fix: Detect "từ X" without explicit range → use hasApproxIntent
    const hasRangeIntent = normalized.includes("từ") && (normalized.includes("đến") || normalized.includes("tới") || normalized.includes("-") || normalized.includes(" to "));
    if (hasApproxIntent || hasRangeIntent) {
        return {
            minPrice: Math.round(valueInVnd * 0.85),
            maxPrice: Math.round(valueInVnd * 1.15),
            label: `khoảng ${currencyMatch[1]} triệu`,
        };
    }

    return null;
};

const fetchBudgetMatches = async (budget) => {
    const rawProducts = await Product.find({ deletedAt: null, isActive: true })
        .select("name brand type price stock description customAttributes specs category")
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
        const limitText = budget.maxPrice ? `${formatVnd(budget.maxPrice)}đ` : `${formatVnd(budget.minPrice)}đ trở lên`;
        return `Hiện tại chưa có sản phẩm phù hợp ${budget.label}. Bạn có thể xem Catalog để lọc theo mức giá gần nhất quanh ${limitText}.`;
    }

    const topMatches = matches.slice(0, 5).map((product) => {
        const brandName = getProductBrandName(product.brand);
        return `- ${brandName} ${product.name}: ${formatVnd(product.price)}đ${product.stock > 0 ? `, còn ${product.stock} chiếc` : ", hết hàng"}`;
    });

    return `Mình tìm được ${matches.length} sản phẩm phù hợp ${budget.label}:\n${topMatches.join("\n")}\n\nBạn muốn mình lọc tiếp theo kiểu máy, thương hiệu hay màu dây không?`;
};

// --- Lấy danh sách sản phẩm từ DB để inject vào prompt ---
const buildProductContext = async () => {
    try {
        const rawProducts = await Product.find({ deletedAt: null, isActive: true })
            .select("name brand type price stock description customAttributes specs category")
            .sort({ salesCount: -1 })
            .limit(60)
            .lean();

        if (!rawProducts || rawProducts.length === 0) return "";

        const products = await CampaignService.applyCampaignToProducts(rawProducts);

        const typeLabel = { mechanical: "Cơ", quartz: "Quartz", automatic: "Tự động", digital: "Điện tử", smartwatch: "Smartwatch" };

        const lines = products.map((p) => {
            let priceStr = p.price ? p.price.toLocaleString("vi-VN") + "đ" : "Liên hệ";
            if (p.originalPrice && p.price < p.originalPrice) {
                 priceStr = `ĐANG SALE [${p.activeCampaignName || 'Flash Sale'}]: ${p.price.toLocaleString("vi-VN")}đ (Gốc: ${p.originalPrice.toLocaleString("vi-VN")}đ)`;
            }

            const stockStr = p.stock > 0 ? `Còn hàng (${p.stock} chiếc)` : "Hết hàng";
            const typeStr = typeLabel[p.type] || p.type;

            // Thuộc tính bổ sung
            const extras = [];
            if (p.specs?.waterResistance) extras.push(`Chống nước: ${p.specs.waterResistance}`);
            if (p.specs?.caseMaterial) extras.push(`Vỏ: ${p.specs.caseMaterial}`);
            if (p.specs?.glass) extras.push(`Kính: ${p.specs.glass}`);
            if (p.customAttributes?.length) {
                p.customAttributes.forEach(a => extras.push(`${a.name}: ${a.value}`));
            }

            return `- [${p.brand}] ${p.name} | Loại: ${typeStr} | Giá: ${priceStr} | ${stockStr}${extras.length ? " | " + extras.join(", ") : ""}`;
        });

        return `\n\n📦 DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI CỬA HÀNG (${products.length} sản phẩm):\n` + lines.join("\n");
    } catch (err) {
        console.error("⚠️ Không thể tải danh sách sản phẩm cho AI:", err.message);
        return "";
    }
};

// --- Prompt gốc của AI ---
const BASE_SYSTEM_PROMPT = `
Bạn là trợ lý ảo AI cao cấp của Luxury Watch, cửa hàng chuyên bán đồng hồ chính hãng.

THÔNG TIN CỬA HÀNG:
- Chính sách bảo hành: 5 năm toàn cầu cho tất cả sản phẩm chính hãng.
- Giao hàng: Nội thành hỏa tốc 2–4h, toàn quốc tiêu chuẩn 1–2 ngày, miễn phí.
- Thanh toán: Thẻ quốc tế (Stripe), VNPay, COD.
- Đổi trả: 1 đổi 1 trong 30 ngày nếu còn nguyên seal, chưa qua sử dụng.
- Hotline: 1900 6789.

HƯỚNG DẪN TRẢ LỜI:
- CHÚ Ý CỰC KỲ QUAN TRỌNG VỀ GIÁ CẢ: 1 triệu = 1,000,000đ. Khi khách hỏi tìm sản phẩm theo một mức giá hoặc khoảng giá (VD: "dưới 10 triệu", "khoảng 5 triệu"), BẮT BUỘC bạn PHẢI so sánh bằng số học và CHỈ GỢI Ý các sản phẩm có giá thỏa mãn ngân sách đó. TUYỆT ĐỐI KHÔNG gợi ý sản phẩm vượt quá ngân sách hoặc giá trị mâu thuẫn. Nếu cửa hàng không có sản phẩm nào trong tầm giá đó, hãy thành thật xin lỗi và gợi ý mức giá gần nhất.
- Khi khách hỏi sản phẩm, hãy gợi ý CỤ THỂ tên sản phẩm, thương hiệu, giá từ danh sách bên dưới.
- Khi khách hỏi giá, hãy trả lời ĐÚNG giá sản phẩm có trong danh sách.
- Khi khách hỏi tình trạng hàng, hãy dựa vào trạng thái "Còn hàng / Hết hàng" trong danh sách.
- Nếu không tìm thấy sản phẩm phù hợp, hãy hướng khách dùng bộ lọc trên trang Catalog.
- Tone: Chuyên nghiệp, lịch sự, sành điệu. Trả lời ngắn gọn (dưới 120 chữ), đi thẳng vào vấn đề.
- KHÔNG bịa đặt sản phẩm không có trong danh sách.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Vui lòng cung cấp nội dung tin nhắn" });
        }

        // ── Step 1: Try budget parsing (fast, no AI needed) ──
        const budget = parseBudgetRange(message);
        if (budget) {
            const matches = await fetchBudgetMatches(budget);
            return res.json({ response: formatBudgetResponse(matches, budget), provider: "built-in" });
        }

        // ── Step 2: Try AI (Gemini > Groq) ──
        const ai = getAIClient();
        if (ai) {
            try {
                const productContext = await buildProductContext();
                const fullSystemPrompt = BASE_SYSTEM_PROMPT + productContext;

                const aiResponse = await callAI(fullSystemPrompt, `Khách hàng: ${message}\nTrợ lý:`);
                if (aiResponse) {
                    return res.json({ response: aiResponse, provider: ai.provider });
                }
            } catch (aiErr) {
                console.error(`[AI ${ai.provider}] Chat error:`, aiErr.message);
            }
        }

        // ── Step 3: Fallback to keyword bot ──
        console.log("⚠️ No AI provider available. Using fallback bot.");
        return res.json({ response: getFallbackBotResponse(message), provider: "fallback" });

    } catch (error) {
        console.error("AI Error:", error.message);
        return res.json({ response: getFallbackBotResponse(req.body?.message || ""), provider: "fallback" });
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
            return res.status(500).json({ message: "Chưa cấu hình GROQ_API_KEY hoặc GEMINI_API_KEY để chạy AI Automation." });
        }

        console.log(`🤖 [AI System] Analyzing pending orders using ${ai.provider}...`);
        
        const pendingOrders = await Order.find({ status: "pending", paymentMethod: "cod" }).populate("user");
        
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
                    order.internalNotes = (order.internalNotes ? order.internalNotes + "\n" : "") + 
                                          `[AI ${providerLabel}] Tự động hủy lúc ${new Date().toLocaleString("vi-VN")}: ${aiAnalysis.reason}`;
                    
                    // Thêm sự kiện tracking
                    order.trackingEvents.push({
                        status: "cancelled",
                        message: "Hệ thống AI từ chối đơn hàng do nghi ngờ rủi ro/spam.",
                        timestamp: new Date()
                    });

                    await order.save();
                    await OrderService.restoreStock(order.products, null, order._id, "AI tự động hủy: " + aiAnalysis.reason);
                    
                    if (order.shippingDetails?.email) {
                        await emailQueue.add("order-status-update", {
                            email: order.shippingDetails.email,
                            subject: "Đơn hàng của bạn đã bị hủy #" + order.orderCode,
                            order: { orderCode: order.orderCode, status: "cancelled", trackingToken: order.trackingToken }
                        });
                    }
                    cancelledCount++;
                } else {
                    order.status = "confirmed";
                    order.internalNotes = (order.internalNotes ? order.internalNotes + "\n" : "") + 
                                          `[AI ${providerLabel}] Xác nhận tự động lúc ${new Date().toLocaleString("vi-VN")}: ${aiAnalysis.reason}`;
                    
                    // Thêm sự kiện tracking
                    order.trackingEvents.push({
                        status: "confirmed",
                        message: "Đơn hàng đã được xác nhận tự động bởi hệ thống.",
                        timestamp: new Date()
                    });

                    await order.save();
                    
                    if (order.shippingDetails?.email) {
                        await emailQueue.add("order-status-update", {
                            email: order.shippingDetails.email,
                            subject: "Đơn hàng đã được xác nhận #" + order.orderCode,
                            order: { orderCode: order.orderCode, status: "confirmed", trackingToken: order.trackingToken }
                        });
                    }
                    confirmedCount++;
                }

            } catch (aiErr) {
                console.error("Lỗi khi gọi Gemini cho Order " + order._id + ":", aiErr.message);
                // Skips order if AI fails, leaving it as pending
            }
        }

        res.json({ 
            success: true, 
            message: `AI đã xử lý ${pendingOrders.length} đơn. Xác nhận: ${confirmedCount}, Hủy: ${cancelledCount}.`,
            confirmedCount,
            cancelledCount
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
            const isTestName = /test|bot|demo|spam|fake|123/i.test(user.name) || /test|bot|fake/i.test(user.email);
            
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
            count
        });
    } catch (error) {
        console.error("AI Automation Error (Users):", error.message);
        res.status(500).json({ message: "Lỗi hệ thống AI", error: error.message });
    }
};

// --- Fallback bot offline ---
const getFallbackBotResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("rolex")) return "Rolex là thương hiệu đồng hồ Thụy Sĩ huyền thoại. Hiện cửa hàng có nhiều dòng Rolex chính hãng. Bạn vui lòng xem trang Catalog để biết tình trạng hàng và giá mới nhất!";
    if (lower.includes("omega")) return "Omega là thương hiệu đồng hồ Thụy Sĩ danh tiếng, đối tác chính thức của NASA. Khám phá bộ sưu tập Omega tại trang Catalog của chúng tôi!";
    if (lower.includes("giá") || lower.includes("bao nhiêu")) return "Cửa hàng có đồng hồ từ nhiều tầm giá khác nhau. Bạn có thể dùng bộ lọc giá trên trang Catalog để tìm sản phẩm phù hợp ngân sách!";
    if (lower.includes("bảo hành")) return "Tất cả sản phẩm được bảo hành chính hãng 5 năm. Bảo hành bao gồm sửa chữa và thay thế linh kiện chính hãng miễn phí.";
    if (lower.includes("giao hàng") || lower.includes("ship")) return "Giao hàng nội thành hỏa tốc 2–4h, toàn quốc 1–2 ngày làm việc, hoàn toàn miễn phí!";
    if (lower.includes("đổi") || lower.includes("trả")) return "Chính sách 1 đổi 1 trong 30 ngày nếu sản phẩm còn nguyên seal, chưa qua sử dụng.";
    if (lower.includes("thanh toán")) return "Cửa hàng hỗ trợ thanh toán thẻ quốc tế, VNPay và COD (thanh toán khi nhận hàng).";
    return "Cảm ơn bạn đã liên hệ Luxury Watch! Vui lòng gọi Hotline 1900 6789 hoặc duyệt trang Catalog để tìm sản phẩm phù hợp.";
};
