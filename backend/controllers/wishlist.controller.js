import Product from "../models/product.model.js";

export const getWishlistProducts = async (req, res) => {
    try {
        const user = await req.user.populate({
            path: "wishlist",
            select: "name price image category description stock",
        });

        res.json(user.wishlist);
    } catch (error) {
        console.error("Error in getWishlistProducts:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        res.status(200).json({ message: "Added to wishlist", wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = req.user;

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        res.status(200).json({ message: "Removed from wishlist", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in removeFromWishlist:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
