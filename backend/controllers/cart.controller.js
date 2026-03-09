// backend/controllers/cart.controller.js
import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		// Populate để lấy thông tin sản phẩm đầy đủ + quantity
		const user = await req.user.populate({
			path: "cartItems.product",
			select: "name price image category description",
		});

		const cartItems = user.cartItems
			.filter((item) => item.product) // lọc sản phẩm bị xóa
			.map((item) => ({
				...item.product.toJSON(),
				quantity: item.quantity,
			}));

		res.json(cartItems);
	} catch (error) {
		console.error("Error in getCartProducts:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		const existingItem = user.cartItems.find(item => item.product.toString() === productId);

		const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
		if (product.stock < newQuantity) return res.status(400).json({ message: "Out of stock" });

		if (existingItem) existingItem.quantity = newQuantity;
		else user.cartItems.push({ product: productId, quantity: 1 });

		await user.save();
		res.status(200).json({ message: "Added to cart" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body; // nếu có productId thì xóa 1, không thì xóa hết
		const user = req.user;

		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter(
				(item) => item.product.toString() !== productId
			);
		}

		await user.save();
		res.status(200).json({ message: "Cart updated", cartItems: user.cartItems });
	} catch (error) {
		console.error("Error in removeAllFromCart:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const productId = req.params.id;
		const { quantity } = req.body;
		const user = req.user;

		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		const existingItem = user.cartItems.find(item => item.product.toString() === productId);

		if (!existingItem) return res.status(404).json({ message: "Item not in cart" });

		if (product.stock < quantity) return res.status(400).json({ message: "Số lượng trong kho không đủ" });

		existingItem.quantity = quantity;

		await user.save();
		res.status(200).json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProductStock = async (req, res) => {
	try {
		const { stock } = req.body;
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });
		product.stock = stock;
		await product.save();
		res.json(product);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};