import { Star } from "lucide-react";

export const renderStars = (rating) =>
  [...Array(5)].map((_, i) => (
    <Star
      key={i}
      className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
    />
  ));
