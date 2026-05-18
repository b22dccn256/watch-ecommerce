import { motion } from "framer-motion";

const CampaignPickerModal = ({ selectedIds = [], onClose, onSuccess, isOpen = true }) => {
	if (!isOpen) return null;
	const selectedCount = Array.isArray(selectedIds) ? selectedIds.length : 0;

	return (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
		onClick={onClose}
	>
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 10, scale: 0.98 }}
			className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-6"
			onClick={(e) => e.stopPropagation()}
		>
			<h3 className="text-lg font-bold text-gray-900 dark:text-white">Gán chiến dịch</h3>
			<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
				Đã chọn {selectedCount} sản phẩm. Tính năng chọn chiến dịch đang được hoàn thiện.
			</p>
			<div className="mt-5 flex justify-end gap-3">
				<button
					onClick={onClose}
					className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200"
				>
					Đóng
				</button>
				<button
					onClick={onSuccess}
					className="px-4 py-2 rounded-lg bg-luxury-gold text-luxury-dark font-semibold"
				>
					Xác nhận
				</button>
			</div>
		</motion.div>
	</motion.div>
	);
};

export default CampaignPickerModal;
