import Banner from "../models/banner.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getBanners = async (req, res) => {
	try {
		const banners = await Banner.find().sort({ createdAt: -1 });
		res.json(banners);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createBanner = async (req, res) => {
	try {
		const { title, image, link } = req.body;
		if (!image) {
			return res.status(400).json({ message: "Image is required" });
		}

		const uploadResponse = await cloudinary.uploader.upload(image, {
			folder: "banners",
		});

		const newBanner = new Banner({
			title: title || "New Banner",
			imageUrl: uploadResponse.secure_url,
			link: link || "",
		});

		await newBanner.save();
		res.status(201).json(newBanner);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteBanner = async (req, res) => {
	try {
		const banner = await Banner.findById(req.params.id);
		if (!banner) {
			return res.status(404).json({ message: "Banner not found" });
		}

		// Optional: delete from cloudinary
		const publicId = banner.imageUrl.split("/").pop().split(".")[0];
		try {
			await cloudinary.uploader.destroy(`banners/${publicId}`);
		} catch (cloudinaryError) {
			console.log("Cloudinary destroy error (swallowed):", cloudinaryError.message);
		}

		await Banner.findByIdAndDelete(req.params.id);
		res.json({ message: "Banner deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleBannerStatus = async (req, res) => {
	try {
		const banner = await Banner.findById(req.params.id);
		if (!banner) {
			return res.status(404).json({ message: "Banner not found" });
		}

		banner.status = banner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
		await banner.save();
		res.json(banner);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
