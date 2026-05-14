import { toast } from "react-hot-toast";

export const confirmToast = (message, onConfirm) => {
	toast(
		(t) => (
			<div className="flex flex-col gap-3 min-w-[250px]">
				<p className="font-medium text-gray-800 dark:text-gray-100">{message}</p>
				<div className="flex justify-end gap-2">
					<button
						className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
						onClick={() => toast.dismiss(t.id)}
					>
						Há»§y
					</button>
					<button
						className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
						onClick={() => {
							toast.dismiss(t.id);
							onConfirm();
						}}
					>
						XĂ¡c nháº­n
					</button>
				</div>
			</div>
		),
		{ duration: 5000 }
	);
};

