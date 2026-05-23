import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductsPagination = ({ currentPage, totalPages, totalCount, onPageChange }) => {
	if (totalPages <= 1) return null;

	return (
		<div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between border-t border-gray-100 dark:border-gray-600">
			<p className="text-xs text-gray-500 dark:text-gray-400">
				Trang {currentPage}/{totalPages} • {totalCount || 0} sản phẩm
			</p>
			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					className="p-1.5 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					<ChevronLeft className="w-3.5 h-3.5" />
				</button>
				{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
					const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
					return (
						<button
							key={page}
							onClick={() => onPageChange(page)}
							className={`w-7 h-7 rounded-lg text-xs font-bold transition ${currentPage === page ? "bg-luxury-gold text-luxury-dark" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
						>
							{page}
						</button>
					);
				})}
				<button
					onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					className="p-1.5 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					<ChevronRight className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
};

export default ProductsPagination;
