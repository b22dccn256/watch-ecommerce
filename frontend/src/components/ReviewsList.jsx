import { useEffect, useState } from "react";
import { Star, ThumbsUp, Calendar } from "lucide-react";
import axios from "../lib/axios";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const ReviewsList = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    axios
      .get(`/reviews/product/${productId}`)
      .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) return null;

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Đánh giá khách hàng
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-500 font-bold text-lg">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-gray-400">/ 5</span>
          <span className="text-gray-400 mx-1">•</span>
          <span className="text-gray-500">{reviews.length} đánh giá</span>
        </div>
      </div>

      {/* Rating bar summary */}
      <div className="flex flex-col gap-1 mb-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-600 font-medium">{star}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-gray-400 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Reviews list */}
      <div className="divide-y divide-gray-100 space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="pt-4 first:pt-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">
                  {review.user?.name || "Người dùng"}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(review.createdAt)}
                  </span>
                  {review.verifiedPurchase && (
                    <span className="text-green-600 font-medium flex items-center gap-0.5">
                      <ThumbsUp className="h-3 w-3" /> Đã mua hàng
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-3.5 w-3.5 ${
                    n <= review.rating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            {review.title && (
              <p className="font-semibold text-sm text-gray-800 mt-1">
                {review.title}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
              {review.comment}
            </p>
            {review.images?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {review.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="review"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;
