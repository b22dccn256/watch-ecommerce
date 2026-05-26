import { useState } from "react";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import { toast } from "react-hot-toast";

const Stars = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl ${n <= value ? 'text-yellow-400' : 'text-gray-400'}`}
          aria-label={`Rate ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ productId }) => {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user || !productId) return null;
  if (submitted) return <div className="text-sm text-amber-300">Đã gửi đánh giá. Đang chờ duyệt.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !title.trim() || !comment.trim()) {
      toast.error("Vui lòng nhập tiêu đề, chọn số sao và viết bình luận");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`/reviews/product/${productId}`, {
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim()
      });
      toast.success("Đã gửi đánh giá. Cảm ơn bạn!");
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi đánh giá";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3 border border-gray-700 rounded-lg bg-gray-800/40">
      <label className="text-sm text-gray-300 font-medium">Đánh giá sản phẩm</label>
      <div className="mt-2 flex items-center justify-between gap-3">
        <Stars value={rating} onChange={setRating} />
      </div>
      <input
        className="mt-3 w-full p-2 rounded-md bg-gray-900 border border-gray-700 text-white text-sm"
        placeholder="Tiêu đề đánh giá (VD: Sản phẩm tuyệt vời)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />
      <textarea
        className="mt-2 w-full p-2 rounded-md bg-gray-900 border border-gray-700 text-white text-sm"
        rows={3}
        placeholder="Viết nhận xét của bạn về sản phẩm (tối thiểu 10 ký tự)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-base btn-primary px-4 py-2">
          {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
        <button type="button" onClick={() => { setRating(5); setTitle(""); setComment(""); }} className="btn-base btn-ghost px-3 py-2 text-sm">
          Hủy
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
