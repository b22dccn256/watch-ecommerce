import { Minus, Plus, Trash, Bookmark, AlertTriangle } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useState, useEffect } from "react";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity, moveToWishlist } = useCartStore();
	const [localQuantity, setLocalQuantity] = useState(item.quantity);

	// Sync local quantity with remote prop changes
	useEffect(() => {
		setLocalQuantity(item.quantity);
	}, [item.quantity]);


	return (
		<div className='rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6'>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<img className='h-20 md:h-32 rounded object-cover' src={item.image} />
				</div>
				<label className='sr-only'>Choose quantity:</label>

				<div className='flex flex-col items-center justify-between md:order-3 md:justify-end gap-2'>
					<div className='flex items-center gap-2'>
						<button
							className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border
							 border-yellow-900 bg-zinc-900 hover:bg-yellow-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed'
							onClick={() => {
								const newQ = localQuantity - 1;
								setLocalQuantity(newQ);
								updateQuantity(item._id, newQ, item.stock);
							}}
							disabled={localQuantity <= 1}
						>
							<Minus className='text-gray-300 w-4 h-4' />
						</button>
						<p className="w-6 text-center text-sm font-semibold">{localQuantity}</p>
						<button
							className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border
							 border-yellow-900 bg-zinc-900 hover:bg-yellow-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed'
							onClick={() => {
								const newQ = localQuantity + 1;
								setLocalQuantity(newQ);
								updateQuantity(item._id, newQ, item.stock);
							}}
							disabled={localQuantity >= item.stock}
						>
							<Plus className='text-gray-300 w-4 h-4' />
						</button>
					</div>

					<div className='text-end md:order-4 min-w-[120px]'>
						<p className='text-lg font-bold text-[#D4AF37]'>
							{(item.price * localQuantity).toLocaleString("vi-VN")} ₫
						</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md'>
					<p className='text-base font-semibold text-white hover:text-[#D4AF37] transition cursor-pointer line-clamp-2'>
						{item.name}
					</p>

					{item.stock <= 5 && item.stock > 0 && (
						<p className="text-xs text-orange-400 flex items-center gap-1 font-medium bg-orange-400/10 w-fit px-2 py-1 rounded">
							<AlertTriangle className="w-3 h-3" />
							Chỉ còn {item.stock} sản phẩm
						</p>
					)}
					{item.stock === 0 && (
						<p className="text-xs text-red-500 font-bold bg-red-500/10 w-fit px-2 py-1 rounded">
							Đã hết hàng
						</p>
					)}

					<div className='flex items-center gap-6 pt-2'>
						<button
							className='inline-flex items-center text-sm font-medium text-red-500 hover:text-red-400 transition hover:bg-red-500/10 px-2 py-1 -ml-2 rounded'
							onClick={() => removeFromCart(item._id)}
							title='Xóa khỏi giỏ hàng'
						>
							<Trash className="w-4 h-4" />
							<span className='ml-1.5'>Xóa</span>
						</button>
						<button
							className='inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition hover:bg-blue-400/10 px-2 py-1 rounded'
							onClick={() => moveToWishlist(item)}
							title='Lưu lại mua sau'
						>
							<Bookmark className="w-4 h-4" />
							<span className='ml-1.5'>Mua sau</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
export default CartItem;
