import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

const NotFoundPage = () => {
	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4 py-24 bg-transparent">
			<div className="max-w-2xl w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-8 md:p-10 text-center shadow-2xl">
				<p className="text-xs font-bold uppercase tracking-[0.22em] text-luxury-gold mb-3">404 Not Found</p>
				<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Không tìm thấy trang</h1>
				<p className="text-gray-600 dark:text-gray-300 mb-8">
					Liên kết có thể đã hết hạn hoặc đường dẫn không tồn tại. Hãy quay lại trang chủ hoặc tiếp tục khám phá catalog.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						to="/"
						className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-luxury-gold text-luxury-dark font-semibold hover:bg-luxury-gold-light transition-colors"
					>
						<Home className="w-4 h-4" /> Trang chủ
					</Link>
					<Link
						to="/catalog"
						className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<Search className="w-4 h-4" /> Xem catalog
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFoundPage;
