import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";

export const getWishlistProducts = async (req, res) => {
	try {
		let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("items.product", "name price image category description stock originalPrice");

		if (!wishlist) {
			return res.json([]);
		}

		// Trả về mảng các sản phẩm (map từ items)
		const products = wishlist.items.map(item => ({
			...item.product._doc,
			addedAt: item.addedAt
		}));

		res.json(products);
	} catch (error) {
		console.error("Error in getWishlistProducts:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const addToWishlist = async (req, res) => {
	try {
		const { productId } = req.body;
		const userId = req.user._id;

		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		let wishlist = await Wishlist.findOne({ user: userId });

		if (!wishlist) {
			wishlist = new Wishlist({ user: userId, items: [{ product: productId }] });
		} else {
			const exists = wishlist.items.find(item => item.product.toString() === productId);
			if (exists) {
				return res.status(400).json({ message: "Product already in wishlist" });
			}
			wishlist.items.push({ product: productId });
		}

		await wishlist.save();
		res.status(200).json({ message: "Added to wishlist", count: wishlist.items.length });
	} catch (error) {
		console.error("Error in addToWishlist:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeFromWishlist = async (req, res) => {
	try {
		const productId = req.params.id;
		const userId = req.user._id;

		const wishlist = await Wishlist.findOne({ user: userId });
		if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

		wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);
		await wishlist.save();

		res.status(200).json({ message: "Removed from wishlist", count: wishlist.items.length });
	} catch (error) {
		console.error("Error in removeFromWishlist:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const mergeWishlist = async (req, res) => {
	try {
		const { items } = req.body; // Array of { productId, addedAt }
		const userId = req.user._id;

		if (!items || !Array.isArray(items)) {
			return res.status(400).json({ message: "Invalid items" });
		}

		let wishlist = await Wishlist.findOne({ user: userId });

		if (!wishlist) {
			wishlist = new Wishlist({ user: userId, items: [] });
		}

		items.forEach(guestItem => {
			const exists = wishlist.items.find(item => item.product.toString() === guestItem.productId);
			if (!exists) {
				wishlist.items.push({
					product: guestItem.productId,
					addedAt: guestItem.addedAt || new Date()
				});
			}
		});

		await wishlist.save();
		res.status(200).json({ message: "Wishlist merged successfully", count: wishlist.items.length });
	} catch (error) {
		console.error("Error in mergeWishlist:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
