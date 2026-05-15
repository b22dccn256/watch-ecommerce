import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";

const QUICK_QUESTIONS = [
    "Rolex Submariner giá bao nhiêu?",
    "Chính sách bảo hành?",
    "Giao hàng mất bao lâu?",
    "Đồng hồ Patek Philippe nào phổ biến nhất?",
];

const stripAccents = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizeChatText = (value) => stripAccents(String(value || "")).toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ").trim();
const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const resolveChatIntent = (text) => {
    const normalized = normalizeChatText(text);

    if (includesAny(normalized, ["co tay nho", "co tay manh", "co tay gay", "tay nho", "tay manh", "tay gay", "small wrist", "wrist nho", "wrist small"])) {
        return { type: "wrist" };
    }

    if (includesAny(normalized, ["top 5", "top5", "top 10", "ban chay nhat", "ban chay", "luot mua", "mua nhieu", "best seller", "best-selling", "rate cao", "danh gia cao", "rating cao", "tot nhat"])) {
        return { type: includesAny(normalized, ["rate cao", "danh gia cao", "rating cao", "tot nhat"]) ? "topRated" : "topSelling" };
    }

    if (includesAny(normalized, ["so sanh", "nao tot hon", "nen chon", "nen mua", "compare"])) {
        return { type: "compare" };
    }

    if (includesAny(normalized, ["huong dan size", "size guide", "do co tay", "do size", "chon size"])) {
        return { type: "sizeGuide" };
    }

    if (includesAny(normalized, ["theo doi don", "tracking", "ma theo doi", "tra don", "don hang cua toi"])) {
        return { type: "tracking" };
    }

    if (includesAny(normalized, ["bao hanh", "warranty"])) return { type: "warranty" };
    if (includesAny(normalized, ["giao hang", "van chuyen", "ship", "delivery"])) return { type: "shipping" };
    if (includesAny(normalized, ["thanh toan", "payment", "cod", "vnpay", "momo", "zalopay"])) return { type: "payment" };
    if (includesAny(normalized, ["doi tra", "tra hang", "return", "hoan tien"])) return { type: "returns" };
    if (includesAny(normalized, ["lien he", "hotline", "contact", "email", "ho tro"])) return { type: "contact" };
    if (includesAny(normalized, ["dang nhap", "dang ky", "verify email", "xac thuc email", "ho so", "profile"])) return { type: "account" };

    const budgetMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(trieu|tr|trieu|m)/);
    if (budgetMatch && includesAny(normalized, ["gia", "ngan sach", "duoi", "toi da", "khong qua", "khoang", "tam", "price", "budget"])) {
        return { type: "budget" };
    }

    return { type: "fallback" };
};

const parseBudgetQuery = (text) => {
    const normalized = normalizeChatText(text);
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(trieu|tr|trieu|m)/);
    if (!match) return null;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return null;

    const maxPrice = amount * 1000000;

    if (includesAny(normalized, ["duoi", "toi da", "khong qua", "under", "less than", "<=", "≤"])) {
        return { maxPrice };
    }

    const rangeMatch = normalized.match(/(?:tu|from)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|trieu|m)\s*(?:den|toi|to|-)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|trieu|m)/);
    if (rangeMatch) {
        return {
            minPrice: Number(rangeMatch[1]) * 1000000,
            maxPrice: Number(rangeMatch[3]) * 1000000,
        };
    }

    if (includesAny(normalized, ["khoang", "tam", "around", "about", "~"])) {
        return {
            minPrice: maxPrice * 0.85,
            maxPrice: maxPrice * 1.15,
        };
    }

    return null;
};

const formatBudgetProducts = (products, budgetText) => {
    if (!products.length) {
        return `Hiện tại chưa có sản phẩm phù hợp ${budgetText}. Bạn muốn mình lọc theo mức giá gần nhất hoặc theo thương hiệu không?`;
    }

    const lines = products.slice(0, 5).map((product) => {
        const brandName = product.brand?.name || product.brand || "Không rõ";
        const price = Number(product.price || 0).toLocaleString("vi-VN");
        return `* **${brandName} ${product.name}**: ${price}đ${product.stock > 0 ? ` - Còn ${product.stock} chiếc` : " - Hết hàng"}`;
    });

    return `Mình tìm được các mẫu phù hợp ${budgetText}:\n\n${lines.join("\n")}\n\nBạn muốn mình lọc tiếp theo thương hiệu, kiểu máy hay màu dây không?`;
};

const buildAction = (label, to, description = "") => ({ label, to, description });

const INTENT_RESPONSE = {
    wrist: {
        content: "Với cổ tay nhỏ, mình ưu tiên mặt 28-38mm, case mỏng, dây thanh và lug-to-lug ngắn để đeo cân đối. Mình sẽ lọc vài mẫu hợp dáng tay ngay đây:",
        action: buildAction("Mở Size Guide", "/size-guide", "Đo cổ tay chính xác hơn"),
    },
    compare: {
        content: "Nếu bạn muốn so sánh mẫu, mình có thể gợi ý theo 3 hướng: độ bền, giá trị giữ giá và độ hợp dáng tay. Bạn cũng có thể mở catalog để đối chiếu trực tiếp.",
        action: buildAction("Mở Catalog", "/catalog", "So sánh sản phẩm trực tiếp"),
    },
    sizeGuide: {
        content: "Mở size guide sẽ giúp bạn đo cổ tay và chọn đường kính mặt đồng hồ phù hợp nhất.",
        action: buildAction("Mở Size Guide", "/size-guide", "Công cụ đo size"),
    },
    tracking: {
        content: "Bạn có thể dán mã theo dõi để xem trạng thái đơn hàng theo thời gian thực.",
        action: buildAction("Theo dõi đơn", "/order-tracking/search", "Nhập mã tracking"),
    },
    warranty: {
        content: "Tất cả sản phẩm được bảo hành chính hãng 5 năm. Bảo hành gồm sửa chữa miễn phí, thay thế linh kiện chính hãng và vệ sinh định kỳ.",
        action: buildAction("Xem chính sách bảo hành", "/warranty", "Chi tiết bảo hành"),
    },
    shipping: {
        content: "Giao hàng hỏa tốc 2-4 giờ nội thành, toàn quốc 1-2 ngày làm việc, miễn phí với đa số đơn hàng.",
        action: buildAction("Xem chính sách giao hàng", "/delivery-policy", "Thời gian và phí ship"),
    },
    payment: {
        content: "Chúng tôi hỗ trợ thẻ quốc tế, VNPay, MoMo, chuyển khoản ngân hàng và COD tùy đơn hàng.",
        action: buildAction("Xem thanh toán", "/checkout", "Xem luồng thanh toán"),
    },
    returns: {
        content: "Đổi trả trong vòng 30 ngày nếu sản phẩm còn nguyên tem, hộp và chưa qua sử dụng.",
        action: buildAction("Xem đổi trả", "/terms", "Chính sách đổi trả"),
    },
    contact: {
        content: "Bạn có thể liên hệ hotline 1900 6789 hoặc email contact@luxurywatch.vn để được hỗ trợ nhanh.",
        action: buildAction("Liên hệ", "/contact", "Mở trang liên hệ"),
    },
    account: {
        content: "Nếu bạn cần đăng nhập, đăng ký hay xác thực email, mình có thể dẫn bạn sang đúng màn hình ngay.",
        action: buildAction("Mở hồ sơ", "/profile", "Trang tài khoản"),
    },
    fallback: {
        content: "Mình có thể tư vấn theo ngân sách, size cổ tay, top sản phẩm bán chạy hoặc đánh giá cao. Nếu bạn muốn, hãy nói ngắn hơn một chút để mình bắt đúng nhu cầu.",
        action: buildAction("Mở Catalog", "/catalog", "Xem toàn bộ sản phẩm"),
    },
};

const formatRankedProducts = (products, heading) => {
    if (!products.length) {
        return {
            content: `Hiện tại mình chưa tìm thấy sản phẩm phù hợp cho mục ${heading}.`,
            products: [],
        };
    }

    return {
        content: `Đây là ${heading} mà mình tìm được từ catalog:`,
        products: products.slice(0, 5).map((product) => ({
            id: product._id,
            name: product.name,
            brand: product.brand?.name || product.brand || "Không rõ",
            price: Number(product.price || 0),
            stock: product.stock || 0,
            averageRating: Number(product.averageRating || 0),
            salesCount: Number(product.salesCount || 0),
            image: product.image,
        })),
    };
};

const parseDiameterMm = (product) => {
    const diameter = product?.specs?.case?.diameter || product?.specs?.diameter || "";
    const match = String(diameter).match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
};

const formatWristProducts = (products) => {
    if (!products.length) {
        return {
            content: "Hiện tại mình chưa tìm thấy mẫu phù hợp cho cổ tay nhỏ. Bạn có thể mở Size Guide để đo cổ tay chính xác hơn.",
            products: [],
        };
    }

    return {
        content: "Với cổ tay nhỏ, mình ưu tiên mặt 28-38mm, dây mảnh và case mỏng để đeo cân đối. Đây là vài mẫu phù hợp từ catalog:",
        products: products.slice(0, 5).map((product) => ({
            id: product._id,
            name: product.name,
            brand: product.brand?.name || product.brand || "Không rõ",
            price: Number(product.price || 0),
            stock: product.stock || 0,
            averageRating: Number(product.averageRating || 0),
            salesCount: Number(product.salesCount || 0),
            image: product.image,
            diameter: parseDiameterMm(product),
        })),
    };
};

const ChatBot = () => {
    const navigate = useNavigate();
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
            const intent = resolveChatIntent(msgText);

            if (intent.type === "tracking" || intent.type === "warranty" || intent.type === "shipping" || intent.type === "payment" || intent.type === "returns" || intent.type === "contact" || intent.type === "account" || intent.type === "sizeGuide" || intent.type === "compare" || intent.type === "fallback") {
                const response = INTENT_RESPONSE[intent.type] || INTENT_RESPONSE.fallback;
                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: response.content,
                    actions: response.action ? [response.action] : [],
                };
                setMessages((prev) => [...prev, botMsg]);
                return;
            }

            if (intent.type === "wrist") {
                const res = await axios.get("/products", {
                    params: {
                        page: 1,
                        limit: 100,
                        sort: "best_selling",
                    },
                });

                const allProducts = Array.isArray(res.data?.products) ? res.data.products : [];
                const wristProducts = allProducts
                    .map((product) => ({ ...product, _diameterMm: parseDiameterMm(product) }))
                    .filter((product) => product._diameterMm == null || product._diameterMm <= 38)
                    .sort((left, right) => {
                        const leftDiameter = left._diameterMm ?? 999;
                        const rightDiameter = right._diameterMm ?? 999;
                        if (leftDiameter !== rightDiameter) return leftDiameter - rightDiameter;
                        const ratingDiff = Number(right.averageRating || 0) - Number(left.averageRating || 0);
                        if (ratingDiff !== 0) return ratingDiff;
                        return Number(right.salesCount || 0) - Number(left.salesCount || 0);
                    });

                const summary = formatWristProducts(wristProducts);
                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: summary.content,
                    products: summary.products,
                };
                setMessages((prev) => [...prev, botMsg]);
                return;
            }

            if (intent.type === "topSelling" || intent.type === "topRated") {
                const res = await axios.get("/products", {
                    params: {
                        page: 1,
                        limit: 100,
                        sort: intent.type === "topSelling" ? "best_selling" : "newest",
                    },
                });

                const allProducts = Array.isArray(res.data?.products) ? res.data.products : [];
                const rankedProducts = [...allProducts]
                    .sort((left, right) => {
                        if (intent.type === "topRated") {
                            const ratingDiff = (Number(right.averageRating || 0) - Number(left.averageRating || 0));
                            if (ratingDiff !== 0) return ratingDiff;
                            return Number(right.salesCount || 0) - Number(left.salesCount || 0);
                        }

                        const salesDiff = Number(right.salesCount || 0) - Number(left.salesCount || 0);
                        if (salesDiff !== 0) return salesDiff;
                        return Number(right.averageRating || 0) - Number(left.averageRating || 0);
                    })
                    .slice(0, 5);

                const summary = formatRankedProducts(
                    rankedProducts,
                    intent.type === "topRated" ? "5 sản phẩm đánh giá cao nhất" : "5 sản phẩm bán chạy nhất"
                );

                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: summary.content,
                    products: summary.products,
                    actions: [buildAction("Mở Catalog", "/catalog", "Xem toàn bộ catalog")],
                };
                setMessages((prev) => [...prev, botMsg]);
                return;
            }

            const budget = parseBudgetQuery(msgText);
            if (budget) {
                const res = await axios.get("/products", {
                    params: {
                        page: 1,
                        sort: "price_asc",
                        limit: 5,
                        ...(budget.minPrice != null ? { minPrice: Math.floor(budget.minPrice) } : {}),
                        ...(budget.maxPrice != null ? { maxPrice: Math.floor(budget.maxPrice) } : {}),
                    },
                });

                const products = Array.isArray(res.data?.products) ? res.data.products : [];
                const budgetText = budget.minPrice != null && budget.maxPrice != null
                    ? `trong khoảng ${Math.round(budget.minPrice / 1000000)} đến ${Math.round(budget.maxPrice / 1000000)} triệu`
                    : budget.maxPrice != null
                        ? `dưới ${Math.round(budget.maxPrice / 1000000)} triệu`
                        : `ở mức giá này`;

                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: formatBudgetProducts(products, budgetText),
                    products: products.slice(0, 5).map((product) => ({
                        id: product._id,
                        name: product.name,
                        brand: product.brand?.name || product.brand || "Không rõ",
                        price: Number(product.price || 0),
                        stock: product.stock || 0,
                        averageRating: Number(product.averageRating || 0),
                        salesCount: Number(product.salesCount || 0),
                        image: product.image,
                    })),
                    actions: [buildAction("Mở Catalog", "/catalog", "Xem thêm sản phẩm")],
                };
                setMessages((prev) => [...prev, botMsg]);
                return;
            }

            const res = await axios.post("/ai/chat", { message: msgText });
            const botMsg = {
                id: Date.now() + 1,
                role: "bot",
                content: res.data.response,
                actions: [buildAction("Mở Catalog", "/catalog", "Xem toàn bộ sản phẩm")],
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
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
                                        {msg.actions?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {msg.actions.map((action) => (
                                                    <button
                                                        key={action.label}
                                                        type="button"
                                                        onClick={() => {
                                                            navigate(action.to);
                                                            setIsOpen(false);
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/20 px-3 py-1.5 text-[11px] font-semibold text-yellow-200 hover:bg-yellow-400/10 hover:border-yellow-400/50 transition"
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {msg.products?.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {msg.products.map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            navigate(`/product/${product.id}`);
                                                            setIsOpen(false);
                                                        }}
                                                        className="w-full text-left rounded-2xl border border-yellow-400/20 bg-black/20 hover:bg-yellow-400/10 hover:border-yellow-400/40 transition p-3"
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="w-12 h-12 rounded-xl bg-[#1f1f13] overflow-hidden flex-shrink-0 border border-white/5">
                                                                {product.image ? (
                                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No img</div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-yellow-300 truncate">{product.brand} {product.name}</div>
                                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                                    {Number(product.price || 0).toLocaleString("vi-VN")}đ · {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-1">
                                                                    ⭐ {Number(product.averageRating || 0).toFixed(1)} · Mua {Number(product.salesCount || 0).toLocaleString("vi-VN")}
                                                                    {product.diameter ? ` · ${product.diameter}mm` : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
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

            {/* Chat toggle button */}
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
