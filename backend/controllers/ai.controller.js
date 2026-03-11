import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/product.model.js";

// --- Lấy danh sách sản phẩm từ DB để inject vào prompt ---
const buildProductContext = async () => {
    try {
        const products = await Product.find({ deletedAt: null, isActive: true })
            .select("name brand type price stock description customAttributes specs")
            .sort({ salesCount: -1 })
            .limit(60)
            .lean();

        if (!products || products.length === 0) return "";

        const typeLabel = { mechanical: "Cơ", quartz: "Quartz", automatic: "Tự động", digital: "Điện tử", smartwatch: "Smartwatch" };

        const lines = products.map((p) => {
            const priceStr = p.price ? p.price.toLocaleString("vi-VN") + "đ" : "Liên hệ";
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
- Thanh toán: Thẻ quốc tế (Stripe), QR chuyển khoản, COD (đơn dưới 50 triệu).
- Đổi trả: 1 đổi 1 trong 30 ngày nếu còn nguyên seal, chưa qua sử dụng.
- Hotline: 1900 6789.

HƯỚNG DẪN TRẢ LỜI:
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

        // Lấy danh sách sản phẩm thực từ DB
        const productContext = await buildProductContext();
        const fullSystemPrompt = BASE_SYSTEM_PROMPT + productContext;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("⚠️ GEMINI_API_KEY is missing. Using fallback bot.");
            return res.json({ response: getFallbackBotResponse(message) });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemma-3-1b-it" });

        const result = await model.generateContent(`${fullSystemPrompt}\n\nKhách hàng: ${message}\nTrợ lý:`);
        const responseText = result.response.text();

        res.json({ response: responseText });
    } catch (error) {
        console.error("AI Error:", error.message);
        console.log("⚠️ Chuyển sang Bot dự phòng Offline...");
        return res.json({ response: getFallbackBotResponse(req.body?.message || "") });
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
    if (lower.includes("thanh toán")) return "Cửa hàng hỗ trợ thanh toán thẻ quốc tế, QR chuyển khoản và COD (thanh toán khi nhận hàng).";
    return "Cảm ơn bạn đã liên hệ Luxury Watch! Vui lòng gọi Hotline 1900 6789 hoặc duyệt trang Catalog để tìm sản phẩm phù hợp.";
};
