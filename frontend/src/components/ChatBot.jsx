import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";

const QUICK_QUESTIONS = [
    "Rolex Submariner giá bao nhiêu?",
    "Chính sách bảo hành?",
    "Giao hàng mất bao lâu?",
    "Đồng hồ Patek Philippe nào phổ biến nhất?",
];

const getBotResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("rolex")) return "Rolex là thương hiệu đồng hồ Thụy Sĩ danh tiếng, thành lập năm 1905. Các dòng nổi tiếng: Submariner (từ 280tr), Daytona (từ 750tr), Day-Date (từ 900tr). Tất cả chính hãng 100% với bảo hành 5 năm.";
    if (lower.includes("patek") || lower.includes("philippe")) return "Patek Philippe là thương hiệu đồng hồ cao cấp nhất thế giới. Các dòng hàng đầu: Nautilus 5711 (2.1 tỷ), Aquanaut 5168 (1.8 tỷ), Calatrava 5227 (1.2 tỷ). Đây là những tài sản đầu tư giá trị cao.";
    if (lower.includes("audemars") || lower.includes("royal oak")) return "Audemars Piguet Royal Oak là biểu tượng đồng hồ thể thao sang trọng. Royal Oak 15500ST (1.85 tỷ), Royal Oak Offshore (từ 2 tỷ). Thiết kế hexagonal bezel đặc trưng không thể nhầm lẫn.";
    if (lower.includes("omega") || lower.includes("speedmaster") || lower.includes("seamaster")) return "Omega nổi tiếng với Seamaster (từ 120tr) và Speedmaster Moonwatch (từ 185tr). Đây là thương hiệu đồng hồ chính thức của NASA và James Bond 007.";
    if (lower.includes("giá") || lower.includes("bao nhiêu") || lower.includes("price")) return "Chúng tôi có đồng hồ từ 50 triệu đến 5 tỷ đồng. Bạn có thể dùng bộ lọc giá trên trang tìm kiếm để tìm sản phẩm phù hợp ngân sách. Tất cả giá đã bao gồm VAT và bảo hành chính hãng.";
    if (lower.includes("bảo hành") || lower.includes("warranty")) return "Tất cả sản phẩm được bảo hành chính hãng 5 năm tại Luxury Watch. Bảo hành bao gồm: sửa chữa miễn phí, thay thế linh kiện chính hãng, và vệ sinh định kỳ. Mang theo phiếu bảo hành khi đến trung tâm.";
    if (lower.includes("vận chuyển") || lower.includes("giao hàng") || lower.includes("ship") || lower.includes("delivery")) return "🚚 Giao hàng hỏa tốc: 2-4 giờ (nội thành TP.HCM & Hà Nội) - 150.000đ\n📦 Giao hàng tiêu chuẩn: 1-2 ngày làm việc - MIỄN PHÍ\n🔒 Tất cả đơn hàng đều được bảo hiểm vận chuyển toàn phần.";
    if (lower.includes("thanh toán") || lower.includes("payment")) return "Chúng tôi chấp nhận: Thẻ tín dụng/ghi nợ (Visa, Mastercard), VNPay, MoMo, Chuyển khoản ngân hàng và COD (thanh toán khi nhận hàng, áp dụng cho đơn dưới 50tr).";
    if (lower.includes("trả hàng") || lower.includes("đổi trả") || lower.includes("return")) return "Chính sách đổi trả trong vòng 30 ngày kể từ ngày nhận hàng. Điều kiện: sản phẩm còn nguyên tem, hộp, chưa có dấu hiệu sử dụng. Liên hệ hotline 1900 6789 để được hỗ trợ.";
    if (lower.includes("xin chào") || lower.includes("hello") || lower.includes("hi") || lower.includes("chào")) return "Xin chào! Rất vui được phục vụ bạn tại Luxury Watch 🌟 Tôi có thể tư vấn về: thương hiệu đồng hồ, lựa chọn theo ngân sách, so sánh sản phẩm, hoặc chính sách mua hàng. Bạn cần hỗ trợ gì?";
    if (lower.includes("so sánh") || lower.includes("nào tốt hơn")) return "Để so sánh đồng hồ, bạn có thể xem xét: 1) Rolex (độ bền cao, giá trị ổn định), 2) Patek Philippe (đỉnh cao kỹ nghệ, tăng giá theo thời gian), 3) Audemars Piguet (thiết kế độc đáo, hiếm có). Hãy cho tôi biết ngân sách để tư vấn chính xác hơn!";
    if (lower.includes("mua") || lower.includes("đặt hàng") || lower.includes("order")) return "Để đặt hàng: 1) Tìm sản phẩm trong danh mục, 2) Nhấn 'Thêm vào giỏ hàng', 3) Thanh toán với nhiều phương thức. Hoặc gọi trực tiếp hotline 1900 6789 để được tư vấn và đặt hàng cùng nhân viên.";
    return "Cảm ơn bạn đã liên hệ Luxury Watch! Tôi có thể tư vấn về thương hiệu, giá cả, bảo hành, vận chuyển và thanh toán. Hoặc liên hệ trực tiếp:\n📞 Hotline: 1900 6789\n📧 Email: contact@luxurywatch.vn\n🏪 Showroom: 123 Đường Lê Lợi, Q.1, TP.HCM";
};

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "bot",
            content: "Xin chào! Tôi là trợ lý AI của Luxury Watch 👑\n\nTôi có thể giúp bạn tìm kiếm đồng hồ phù hợp, tư vấn thương hiệu và giải đáp mọi thắc mắc. Bạn cần hỗ trợ gì không?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (text) => {
        const msgText = text || input;
        if (!msgText.trim()) return;

        const userMsg = { id: Date.now(), role: "user", content: msgText };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await axios.post("/ai/chat", { message: msgText });
            const botMsg = {
                id: Date.now() + 1,
                role: "bot",
                content: res.data.response,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                role: "bot",
                content: "Xin lỗi, hệ thống AI đang bảo trì. Vui lòng gọi 1900 6789.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[340px] bg-[#1a1a0e] border border-[#3a3a1a] rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-black/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <div className="font-bold text-black text-sm leading-tight">AI Tư Vấn</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-700 animate-pulse" />
                                        <span className="text-black/70 text-[10px] font-medium">Trực tuyến • Phản hồi ngay</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4 text-black" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-yellow-900">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "bot" && (
                                        <div className="w-7 h-7 bg-yellow-400/20 border border-yellow-400/30 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                            <Sparkles className="w-3 h-3 text-yellow-400" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] text-sm px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-line ${msg.role === "user"
                                            ? "bg-yellow-400 text-black font-medium rounded-br-none"
                                            : "bg-[#2a2a1a] border border-[#3a3a1a] text-gray-200 rounded-bl-none"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start items-end gap-2">
                                    <div className="w-7 h-7 bg-yellow-400/20 border border-yellow-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-3 h-3 text-yellow-400" />
                                    </div>
                                    <div className="bg-[#2a2a1a] border border-[#3a3a1a] px-4 py-3 rounded-2xl rounded-bl-none">
                                        <div className="flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        {messages.length <= 1 && (
                            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="text-xs bg-[#2a2a1a] border border-yellow-900/50 hover:border-yellow-400 text-yellow-400/80 hover:text-yellow-400 px-3 py-1.5 rounded-full transition"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-[#3a3a1a] flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="flex-1 bg-[#2a2a1a] border border-[#3a3a1a] focus:border-yellow-400 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none transition placeholder-gray-600"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black p-2.5 rounded-xl transition"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative bg-yellow-400 hover:bg-yellow-300 text-black p-4 rounded-full shadow-2xl shadow-yellow-400/30 transition"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <MessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Notification dot */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0f0f0f]" />
                )}
            </motion.button>
        </div>
    );
};

export default ChatBot;
