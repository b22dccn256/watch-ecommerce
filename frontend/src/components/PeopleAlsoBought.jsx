import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				const res = await axios.get("/products/recommendations");
				setRecommendations(res.data);
			} catch (error) {
				toast.error(error.response?.data?.message || "Lỗi khi tải danh sách sản phẩm gợi ý");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className='mt-10'>
			<h3 className='hero-title text-lg md:text-xl font-semibold text-primary'>Có thể bạn cũng thích</h3>
			<div className='mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
				{recommendations.map((product) => (
					<Link
						key={product._id}
						to={`/product/${product._id}`}
						className='group rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all'
					>
						<div className='aspect-[4/3] bg-gray-100 dark:bg-black overflow-hidden'>
							<img
								src={product.image || "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop"}
								alt={product.name}
								className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
							/>
						</div>
						<div className='p-3 md:p-4 space-y-1.5'>
							<p className='text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500'>Đồng hồ luxury</p>
							<h4 className='text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug'>{product.name}</h4>
							<p className='text-[11px] text-secondary'>Bảo hành quốc tế 5 năm</p>
							<p className='text-sm font-bold text-luxury-gold'>{product.price?.toLocaleString("vi-VN")} ₫</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
};
export default PeopleAlsoBought;
