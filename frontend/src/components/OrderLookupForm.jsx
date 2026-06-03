import { useState } from "react";
import { Search, ArrowRight, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import Input from "./ui/Input";

const OrderLookupForm = ({ onClose, autoFocusFirst = false }) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e && e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/orders/lookup", { orderNumber, email });
      const { trackingToken } = res.data;
      toast.success("Đã tìm thấy đơn hàng!");
      onClose && onClose();
      navigate(`/order-tracking/${trackingToken}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Không tìm thấy đơn hàng khớp với thông tin cung cấp.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLookup}
      className="bg-white dark:bg-white/5 border border-gray-200 dark:border-luxury-border p-5 md:p-6 rounded-2xl shadow-sm space-y-5 w-full max-w-xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            label="Mã đơn hàng *"
            type="text"
            required
            autoFocus={autoFocusFirst}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Ví dụ: ORD-123456"
            className="pl-12"
          />
          <Search className="absolute left-4 top-[2.35rem] text-gray-400 w-4 h-4" />
        </div>

        <Input
          label="Email nhận hàng *"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-base btn-primary h-11 w-full"
      >
        {loading ? (
          "ĐANG TÌM KIẾM..."
        ) : (
          <>
            TRA CỨU NGAY
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-luxury-dark/60 border border-gray-200 dark:border-luxury-border rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-luxury-text-muted leading-relaxed">
          Mã đơn hàng đã được gửi vào email của bạn ngay sau khi đặt hàng thành
          công. Nếu không tìm thấy, vui lòng kiểm tra hộp thư Spam hoặc liên hệ
          Hotline 1900 8888.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Xem lịch sử đơn
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose && onClose();
            navigate("/support");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Trung tâm Hỗ trợ
        </button>
      </div>
    </form>
  );
};

export default OrderLookupForm;
