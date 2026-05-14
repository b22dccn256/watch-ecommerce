import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";

const QUICK_QUESTIONS = [
    "Rolex Submariner giĂ¡ bao nhiĂªu?",
    "ChĂ­nh sĂ¡ch báº£o hĂ nh?",
    "Giao hĂ ng máº¥t bao lĂ¢u?",
    "Äá»“ng há»“ Patek Philippe nĂ o phá»• biáº¿n nháº¥t?",
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

    if (includesAny(normalized, ["duoi", "toi da", "khong qua", "under", "less than", "<=", "â‰¤"])) {
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
        return `Hiá»‡n táº¡i chÆ°a cĂ³ sáº£n pháº©m phĂ¹ há»£p ${budgetText}. Báº¡n muá»‘n mĂ¬nh lá»c theo má»©c giĂ¡ gáº§n nháº¥t hoáº·c theo thÆ°Æ¡ng hiá»‡u khĂ´ng?`;
    }

    const lines = products.slice(0, 5).map((product) => {
        const brandName = product.brand?.name || product.brand || "KhĂ´ng rĂµ";
        const price = Number(product.price || 0).toLocaleString("vi-VN");
        return `* **${brandName} ${product.name}**: ${price}Ä‘${product.stock > 0 ? ` - CĂ²n ${product.stock} chiáº¿c` : " - Háº¿t hĂ ng"}`;
    });

    return `MĂ¬nh tĂ¬m Ä‘Æ°á»£c cĂ¡c máº«u phĂ¹ há»£p ${budgetText}:\n\n${lines.join("\n")}\n\nBáº¡n muá»‘n mĂ¬nh lá»c tiáº¿p theo thÆ°Æ¡ng hiá»‡u, kiá»ƒu mĂ¡y hay mĂ u dĂ¢y khĂ´ng?`;
};

const buildAction = (label, to, description = "") => ({ label, to, description });

const INTENT_RESPONSE = {
    wrist: {
        content: "Vá»›i cá»• tay nhá», mĂ¬nh Æ°u tiĂªn máº·t 28-38mm, case má»ng, dĂ¢y thanh vĂ  lug-to-lug ngáº¯n Ä‘á»ƒ Ä‘eo cĂ¢n Ä‘á»‘i. MĂ¬nh sáº½ lá»c vĂ i máº«u há»£p dĂ¡ng tay ngay Ä‘Ă¢y:",
        action: buildAction("Má»Ÿ Size Guide", "/size-guide", "Äo cá»• tay chĂ­nh xĂ¡c hÆ¡n"),
    },
    compare: {
        content: "Náº¿u báº¡n muá»‘n so sĂ¡nh máº«u, mĂ¬nh cĂ³ thá»ƒ gá»£i Ă½ theo 3 hÆ°á»›ng: Ä‘á»™ bá»n, giĂ¡ trá»‹ giá»¯ giĂ¡ vĂ  Ä‘á»™ há»£p dĂ¡ng tay. Báº¡n cÅ©ng cĂ³ thá»ƒ má»Ÿ catalog Ä‘á»ƒ Ä‘á»‘i chiáº¿u trá»±c tiáº¿p.",
        action: buildAction("Má»Ÿ Catalog", "/catalog", "So sĂ¡nh sáº£n pháº©m trá»±c tiáº¿p"),
    },
    sizeGuide: {
        content: "Má»Ÿ size guide sáº½ giĂºp báº¡n Ä‘o cá»• tay vĂ  chá»n Ä‘Æ°á»ng kĂ­nh máº·t Ä‘á»“ng há»“ phĂ¹ há»£p nháº¥t.",
        action: buildAction("Má»Ÿ Size Guide", "/size-guide", "CĂ´ng cá»¥ Ä‘o size"),
    },
    tracking: {
        content: "Báº¡n cĂ³ thá»ƒ dĂ¡n mĂ£ theo dĂµi Ä‘á»ƒ xem tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng theo thá»i gian thá»±c.",
        action: buildAction("Theo dĂµi Ä‘Æ¡n", "/order-tracking/search", "Nháº­p mĂ£ tracking"),
    },
    warranty: {
        content: "Táº¥t cáº£ sáº£n pháº©m Ä‘Æ°á»£c báº£o hĂ nh chĂ­nh hĂ£ng 5 nÄƒm. Báº£o hĂ nh gá»“m sá»­a chá»¯a miá»…n phĂ­, thay tháº¿ linh kiá»‡n chĂ­nh hĂ£ng vĂ  vá»‡ sinh Ä‘á»‹nh ká»³.",
        action: buildAction("Xem chĂ­nh sĂ¡ch báº£o hĂ nh", "/warranty", "Chi tiáº¿t báº£o hĂ nh"),
    },
    shipping: {
        content: "Giao hĂ ng há»a tá»‘c 2-4 giá» ná»™i thĂ nh, toĂ n quá»‘c 1-2 ngĂ y lĂ m viá»‡c, miá»…n phĂ­ vá»›i Ä‘a sá»‘ Ä‘Æ¡n hĂ ng.",
        action: buildAction("Xem chĂ­nh sĂ¡ch giao hĂ ng", "/delivery-policy", "Thá»i gian vĂ  phĂ­ ship"),
    },
    payment: {
        content: "ChĂºng tĂ´i há»— trá»£ tháº» quá»‘c táº¿, VNPay, MoMo, chuyá»ƒn khoáº£n ngĂ¢n hĂ ng vĂ  COD tĂ¹y Ä‘Æ¡n hĂ ng.",
        action: buildAction("Xem thanh toĂ¡n", "/checkout", "Xem luá»“ng thanh toĂ¡n"),
    },
    returns: {
        content: "Äá»•i tráº£ trong vĂ²ng 30 ngĂ y náº¿u sáº£n pháº©m cĂ²n nguyĂªn tem, há»™p vĂ  chÆ°a qua sá»­ dá»¥ng.",
        action: buildAction("Xem Ä‘á»•i tráº£", "/terms", "ChĂ­nh sĂ¡ch Ä‘á»•i tráº£"),
    },
    contact: {
        content: "Báº¡n cĂ³ thá»ƒ liĂªn há»‡ hotline 1900 6789 hoáº·c email contact@luxurywatch.vn Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ nhanh.",
        action: buildAction("LiĂªn há»‡", "/contact", "Má»Ÿ trang liĂªn há»‡"),
    },
    account: {
        content: "Náº¿u báº¡n cáº§n Ä‘Äƒng nháº­p, Ä‘Äƒng kĂ½ hay xĂ¡c thá»±c email, mĂ¬nh cĂ³ thá»ƒ dáº«n báº¡n sang Ä‘Ăºng mĂ n hĂ¬nh ngay.",
        action: buildAction("Má»Ÿ há»“ sÆ¡", "/profile", "Trang tĂ i khoáº£n"),
    },
    fallback: {
        content: "MĂ¬nh cĂ³ thá»ƒ tÆ° váº¥n theo ngĂ¢n sĂ¡ch, size cá»• tay, top sáº£n pháº©m bĂ¡n cháº¡y hoáº·c Ä‘Ă¡nh giĂ¡ cao. Náº¿u báº¡n muá»‘n, hĂ£y nĂ³i ngáº¯n hÆ¡n má»™t chĂºt Ä‘á»ƒ mĂ¬nh báº¯t Ä‘Ăºng nhu cáº§u.",
        action: buildAction("Má»Ÿ Catalog", "/catalog", "Xem toĂ n bá»™ sáº£n pháº©m"),
    },
};

const formatRankedProducts = (products, heading) => {
    if (!products.length) {
        return {
            content: `Hiá»‡n táº¡i mĂ¬nh chÆ°a tĂ¬m tháº¥y sáº£n pháº©m phĂ¹ há»£p cho má»¥c ${heading}.`,
            products: [],
        };
    }

    return {
        content: `ÄĂ¢y lĂ  ${heading} mĂ  mĂ¬nh tĂ¬m Ä‘Æ°á»£c tá»« catalog:`,
        products: products.slice(0, 5).map((product) => ({
            id: product._id,
            name: product.name,
            brand: product.brand?.name || product.brand || "KhĂ´ng rĂµ",
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
            content: "Hiá»‡n táº¡i mĂ¬nh chÆ°a tĂ¬m tháº¥y máº«u phĂ¹ há»£p cho cá»• tay nhá». Báº¡n cĂ³ thá»ƒ má»Ÿ Size Guide Ä‘á»ƒ Ä‘o cá»• tay chĂ­nh xĂ¡c hÆ¡n.",
            products: [],
        };
    }

    return {
        content: "Vá»›i cá»• tay nhá», mĂ¬nh Æ°u tiĂªn máº·t 28-38mm, dĂ¢y máº£nh vĂ  case má»ng Ä‘á»ƒ Ä‘eo cĂ¢n Ä‘á»‘i. ÄĂ¢y lĂ  vĂ i máº«u phĂ¹ há»£p tá»« catalog:",
        products: products.slice(0, 5).map((product) => ({
            id: product._id,
            name: product.name,
            brand: product.brand?.name || product.brand || "KhĂ´ng rĂµ",
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
            content: "Xin chĂ o! TĂ´i lĂ  trá»£ lĂ½ AI cá»§a Luxury Watch đŸ‘‘\n\nTĂ´i cĂ³ thá»ƒ giĂºp báº¡n tĂ¬m kiáº¿m Ä‘á»“ng há»“ phĂ¹ há»£p, tÆ° váº¥n thÆ°Æ¡ng hiá»‡u vĂ  giáº£i Ä‘Ă¡p má»i tháº¯c máº¯c. Báº¡n cáº§n há»— trá»£ gĂ¬ khĂ´ng?",
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
                    intent.type === "topRated" ? "5 sáº£n pháº©m Ä‘Ă¡nh giĂ¡ cao nháº¥t" : "5 sáº£n pháº©m bĂ¡n cháº¡y nháº¥t"
                );

                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: summary.content,
                    products: summary.products,
                    actions: [buildAction("Má»Ÿ Catalog", "/catalog", "Xem toĂ n bá»™ catalog")],
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
                    ? `trong khoáº£ng ${Math.round(budget.minPrice / 1000000)} Ä‘áº¿n ${Math.round(budget.maxPrice / 1000000)} triá»‡u`
                    : budget.maxPrice != null
                        ? `dÆ°á»›i ${Math.round(budget.maxPrice / 1000000)} triá»‡u`
                        : `á»Ÿ má»©c giĂ¡ nĂ y`;

                const botMsg = {
                    id: Date.now() + 1,
                    role: "bot",
                    content: formatBudgetProducts(products, budgetText),
                    products: products.slice(0, 5).map((product) => ({
                        id: product._id,
                        name: product.name,
                        brand: product.brand?.name || product.brand || "KhĂ´ng rĂµ",
                        price: Number(product.price || 0),
                        stock: product.stock || 0,
                        averageRating: Number(product.averageRating || 0),
                        salesCount: Number(product.salesCount || 0),
                        image: product.image,
                    })),
                    actions: [buildAction("Má»Ÿ Catalog", "/catalog", "Xem thĂªm sáº£n pháº©m")],
                };
                setMessages((prev) => [...prev, botMsg]);
                return;
            }

            const res = await axios.post("/ai/chat", { message: msgText });
            const botMsg = {
                id: Date.now() + 1,
                role: "bot",
                content: res.data.response,
                actions: [buildAction("Má»Ÿ Catalog", "/catalog", "Xem toĂ n bá»™ sáº£n pháº©m")],
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            const errorMsg = {
                id: Date.now() + 1,
                role: "bot",
                content: "Xin lá»—i, há»‡ thá»‘ng AI Ä‘ang báº£o trĂ¬. Vui lĂ²ng gá»i 1900 6789.",
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
                                    <div className="font-bold text-black text-sm leading-tight">AI TÆ° Váº¥n</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-700 animate-pulse" />
                                        <span className="text-black/70 text-[10px] font-medium">Trá»±c tuyáº¿n â€¢ Pháº£n há»“i ngay</span>
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
                                                                    {Number(product.price || 0).toLocaleString("vi-VN")}Ä‘ Â· {product.stock > 0 ? `CĂ²n ${product.stock}` : "Háº¿t hĂ ng"}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-1">
                                                                    â­ {Number(product.averageRating || 0).toFixed(1)} Â· Mua {Number(product.salesCount || 0).toLocaleString("vi-VN")}
                                                                    {product.diameter ? ` Â· ${product.diameter}mm` : ""}
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
                                placeholder="Nháº­p cĂ¢u há»i cá»§a báº¡n..."
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

