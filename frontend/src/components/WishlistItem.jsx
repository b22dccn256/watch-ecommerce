import { Trash, ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const WishlistItem = ({ item }) => {
    const { removeFromWishlist, moveToCartFromWishlist } = useCartStore();

    return (
        <div className='rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6'>
            <div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
                <div className='shrink-0 md:order-1'>
                    <img className='h-20 md:h-32 rounded object-cover' src={item.image} alt={item.name} />
                </div>

                <div className='flex items-center justify-between md:order-3 md:justify-end'>
                    <div className='text-end md:w-32'>
                        <p className='text-base font-bold text-emerald-400'>{item.price.toLocaleString("vi-VN")} ₫</p>
                    </div>
                </div>

                <div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
                    <p className='text-base font-medium text-white hover:text-emerald-400 hover:underline'>
                        {item.name}
                    </p>
                    <p className='text-sm text-gray-400 line-clamp-2'>{item.description}</p>

                    <div className='flex items-center gap-4'>
                        <button
                            className='inline-flex items-center text-sm font-medium text-red-400
							 hover:text-red-300 hover:underline'
                            onClick={() => removeFromWishlist(item._id)}
                            title='Xóa khỏi mua sau'
                        >
                            <Trash className="w-4 h-4" />
                            <span className='ml-1'>Xóa</span>
                        </button>
                        <button
                            className='inline-flex items-center text-sm font-medium text-emerald-400
							 hover:text-emerald-300 hover:underline'
                            onClick={() => moveToCartFromWishlist(item)}
                            title='Chuyển lại vào giỏ hàng'
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className='ml-1'>Chuyển vào giỏ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WishlistItem;
