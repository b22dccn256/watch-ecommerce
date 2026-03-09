import { GoogleGenerativeAI } from "@google/generative-ai";

const systemPrompt = `
Bạn là trợ lý ảo AI cao cấp của Luxury Watch, cửa hàng bán đồng hồ Thụy Sĩ sang trọng.
Kiến thức của bạn:
- Các hãng đồng hồ nổi tiếng: Rolex, Patek Philippe, Audemars Piguet, Omega, v.v.
- Chính sách: Bảo hành 5 năm toàn cầu, giao hàng hỏa tốc nội thành 2-4h, tiêu chuẩn 1-2 ngày miễn phí.
- Thanh toán: Thẻ, VNPay, COD (đơn dưới 50tr).
- Chế độ đãi ngộ: 1 đổi 1 trong 30 ngày nếu nguyên seal.
Tone of voice: Chuyên nghiệp, lịch sự, tư vấn tận tình, sành điệu. Trả lời thật ngắn gọn (dưới 100 chữ), đi thẳng vào vấn đề.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Vui lòng cung cấp nội dung tin nhắn" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Fallback khi chưa cài đặt API Key, dùng logic cũ
            console.log("⚠️ GEMINI_API_KEY is missing. Using fallback bot.");
            return res.json({ response: getFallbackBotResponse(message) });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(`${systemPrompt}\n\nKhách hàng: ${message}\nTrợ lý:`);
        const responseText = result.response.text();

        res.json({ response: responseText });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ message: "Lỗi kết nối AI" });
    }
};

const getFallbackBotResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("rolex")) return "Rolex là thương hiệu đồng hồ Thụy Sĩ danh tiếng, thành lập năm 1905. Các dòng nổi tiếng: Submariner (từ 280tr), Daytona (từ 750tr), Day-Date (từ 900tr). Tất cả chính hãng 100% với bảo hành 5 năm.";
    if (lower.includes("giá") || lower.includes("bao nhiêu")) return "Chúng tôi có đồng hồ từ 50 triệu đến 5 tỷ đồng. Bạn có thể dùng bộ lọc giá trên trang tìm kiếm để tìm sản phẩm phù hợp ngân sách.";
    if (lower.includes("bảo hành")) return "Tất cả sản phẩm được bảo hành chính hãng 5 năm tại Luxury Watch. Bảo hành bao gồm: sửa chữa miễn phí, thay thế linh kiện chính hãng.";
    return "Cảm ơn bạn đã liên hệ Luxury Watch! Hiện tại hệ thống AI đang được nâng cấp, vui lòng gọi Hotline 1900 6789 để được hỗ trợ nhanh nhất.";
};
