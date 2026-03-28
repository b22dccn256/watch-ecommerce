// backend/controllers/cart.controller.js
import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		// Populate để lấy thông tin sản phẩm đầy đủ + quantity
		const user = await req.user.populate({
			path: "cartItems.product",
			select: "name price image category description",
		});

		const validCartItems = user.cartItems.filter((item) => item.product);

		// Auto-clean if any product was deleted from DB (item.product is null)
		if (validCartItems.length !== user.cartItems.length) {
			user.cartItems = validCartItems;
			await user.save();
		}

		const cartItems = validCartItems.map((item) => ({
			...item.product.toJSON(),
			quantity: item.quantity,
			wristSize: item.wristSize || null,
		}));

		res.json(cartItems);
	} catch (error) {
		console.error("Error in getCartProducts:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId, wristSize } = req.body;
		const user = req.user;
		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		// Match exactly product ID and wristSize
		const existingItem = user.cartItems.find(
			item => item.product.toString() === productId && (item.wristSize || null) === (wristSize || null)
		);

		const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
		
		let availableStock = product.stock;
		if (wristSize && product.wristSizeOptions?.length > 0) {
			const sizeOption = product.wristSizeOptions.find(o => o.size === wristSize);
			if (sizeOption) availableStock = sizeOption.stock;
		}

		if (availableStock < newQuantity) {
			return res.status(400).json({ message: `Sản phẩm này (size ${wristSize || 'mặc định'}) chỉ còn ${availableStock} cái trong kho` });
		}

		if (existingItem) {
			existingItem.quantity = newQuantity;
		}
		else user.cartItems.push({ product: productId, quantity: 1, wristSize: wristSize || null });

		user.cartUpdatedAt = Date.now();
		await user.save();
		res.status(200).json({ message: "Added to cart" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId, wristSize } = req.body; // nếu có productId thì xóa 1, không thì xóa hết
		const user = req.user;

		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter(
				(item) => !(item.product.toString() === productId && (item.wristSize || null) === (wristSize || null))
			);
		}

		user.cartUpdatedAt = Date.now();
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
		const { quantity, wristSize } = req.body;
		const user = req.user;

		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		const existingItem = user.cartItems.find(
			item => item.product.toString() === productId && (item.wristSize || null) === (wristSize || null)
		);

		if (!existingItem) return res.status(404).json({ message: "Item not in cart" });

		let availableStock = product.stock;
		if (wristSize && product.wristSizeOptions?.length > 0) {
			const sizeOption = product.wristSizeOptions.find(o => o.size === wristSize);
			if (sizeOption) availableStock = sizeOption.stock;
		}

		if (availableStock < quantity) {
			return res.status(400).json({ message: `Sản phẩm này (size ${wristSize || 'mặc định'}) chỉ còn ${availableStock} cái trong kho` });
		}

		existingItem.quantity = quantity;

		user.cartUpdatedAt = Date.now();
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

export const mergeCart = async (req, res) => {
	try {
		const { guestCartItems } = req.body;
		const user = req.user;

		if (!guestCartItems || guestCartItems.length === 0) {
			return res.status(200).json({ message: "No items to merge", cartItems: user.cartItems });
		}

		for (const guestItem of guestCartItems) {
			const product = await Product.findById(guestItem._id || guestItem.productId);
			if (!product) continue; // Skip deleted products

			const existingItem = user.cartItems.find(
				item => item.product.toString() === product._id.toString() && (item.wristSize || null) === (guestItem.wristSize || null)
			);

			let availableStock = product.stock;
			if (guestItem.wristSize && product.wristSizeOptions?.length > 0) {
				const sizeOption = product.wristSizeOptions.find(o => o.size === guestItem.wristSize);
				if (sizeOption) availableStock = sizeOption.stock;
			}

			if (existingItem) {
				// Sum the quantities but clamp to max stock
				const mergedQuantity = existingItem.quantity + guestItem.quantity;
				existingItem.quantity = Math.min(mergedQuantity, availableStock);
			} else {
				// Add new item if stock allows
				const initialQuantity = Math.min(guestItem.quantity, availableStock);
				if (initialQuantity > 0) {
					user.cartItems.push({ product: product._id, quantity: initialQuantity, wristSize: guestItem.wristSize || null });
				}
			}
		}

		user.cartUpdatedAt = Date.now();
		await user.save();
		res.status(200).json({ message: "Cart merged successfully" });

	} catch (error) {
		console.error("Error in mergeCart:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};