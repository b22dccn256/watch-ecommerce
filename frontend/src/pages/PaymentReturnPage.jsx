import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";
import { SkeletonPageShell } from "../components/SkeletonLoaders";

const PaymentReturnPage = ({ method }) => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("loading"); // "loading", "success", "failed"
    const [message, setMessage] = useState("Äang xá»­ lĂ½ káº¿t quáº£ giao dá»‹ch...");
    const { clearSelectedCart } = useCartStore();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const processReturn = async () => {
            try {
                const query = Object.fromEntries(searchParams.entries());

                const maxAttempts = 6;
                let attempt = 0;
                let verification = null;

                while (attempt < maxAttempts) {
                    const res = await axios.post("/payments/verify-return", {
                        method,
                        query,
                    });
                    verification = res.data;

                    if (verification.status === "success" || verification.status === "failed") {
                        break;
                    }

                    attempt += 1;
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }

                if (!verification) {
                    setStatus("failed");
                    setMessage("KhĂ´ng thá»ƒ xĂ¡c minh giao dá»‹ch tá»« há»‡ thá»‘ng.");
                    return;
                }

                if (verification.status === "success") {
                    clearSelectedCart();
                    setStatus("success");
                    setMessage("Giao dá»‹ch thĂ nh cĂ´ng! ÄÆ¡n hĂ ng cá»§a báº¡n Ä‘ang Ä‘Æ°á»£c chuáº©n bá»‹.");
                } else if (verification.status === "pending") {
                    setStatus("failed");
                    setMessage("Thanh toĂ¡n Ä‘ang Ä‘Æ°á»£c Ä‘á»‘i soĂ¡t. Vui lĂ²ng kiá»ƒm tra láº¡i sau trong má»¥c theo dĂµi Ä‘Æ¡n hĂ ng.");
                } else {
                    setStatus("failed");
                    setMessage(verification.message || "Giao dá»‹ch khĂ´ng thĂ nh cĂ´ng. Vui lĂ²ng thá»­ láº¡i.");
                }
            } catch (error) {
                console.error("Error processing return:", error);
                setStatus("failed");
                const msg = error?.response?.data?.message || "Lá»—i xá»­ lĂ½ káº¿t quáº£ thanh toĂ¡n.";
                setMessage(msg);
            }
        };

        processReturn();
    }, [method, searchParams, clearSelectedCart]);

    if (status === "loading") {
        return <SkeletonPageShell rows={4} />;
    }

    if (status === "success") {
        return (
            <div className="min-h-screen py-32 flex items-center justify-center bg-gray-50 dark:bg-[#0f0c08]">
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.15}
                    colors={["#B7925A", "#C7A775", "#151311", "#8E6F42"]}
                />
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 relative z-10 m-4">
                    <div className="w-20 h-20 bg-[color:var(--color-gold)]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-[color:var(--color-gold)]" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thanh ToĂ¡n ThĂ nh CĂ´ng</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-8">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            ChĂºng tĂ´i Ä‘Ă£ gá»­i email xĂ¡c nháº­n cĂ¹ng biĂªn lai chi tiáº¿t Ä‘áº¿n hĂ²m thÆ° cá»§a báº¡n.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/catalog"
                            className="btn-base btn-primary h-11 w-full"
                        >
                            Tiáº¿p tá»¥c mua sáº¯m <ShoppingBag className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-32 flex items-center justify-center bg-gray-50 dark:bg-[#0f0c08]">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 m-4">
                <div className="w-20 h-20 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-[color:var(--color-gold)]" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thanh ToĂ¡n Tháº¥t Báº¡i</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/cart"
                        className="w-full bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        Quay láº¡i Giá» hĂ ng <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentReturnPage;

