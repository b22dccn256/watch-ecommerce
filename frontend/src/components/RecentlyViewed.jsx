import { useEffect, useState } from "react";
import axios from "../lib/axios";
import ProductCard from "./ProductCard";

const RecentlyViewed = ({ max = 6 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentlyViewed");
      const ids = raw ? JSON.parse(raw) : [];
      if (!ids.length) return;
      const top = ids.slice(0, max);
      Promise.all(top.map(id => axios.get(`/products/${id}`).then(r => r.data).catch(() => null)))
        .then(res => setItems(res.filter(Boolean)));
    } catch (error) {
      void error;
    }
  }, [max]);

  if (!items.length) return null;

  return (
    <section className="py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="hero-kicker text-[color:var(--color-gold)]">Bạn đã xem</p>
          <h3 className="hero-title text-2xl font-bold">Sản phẩm vừa xem</h3>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(p => (
          <div key={p._id} className="motion-item">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
