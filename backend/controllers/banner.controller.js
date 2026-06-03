import Banner from "../models/banner.model.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
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

    // Place new banner at the end by default
    const last = await Banner.findOne().sort({ order: -1 }).select("order");
    newBanner.order = (last?.order || 0) + 1;

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
      console.log(
        "Cloudinary destroy error (swallowed):",
        cloudinaryError.message,
      );
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

export const reorderBanners = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { order: index } },
      },
    }));

    await Banner.bulkWrite(bulkOps);
    const updated = await Banner.find().sort({ order: 1 });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { title, link } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    if (title !== undefined) banner.title = title;
    if (link !== undefined) banner.link = link;

    await banner.save();
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
