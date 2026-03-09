import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

// Helper for slugs
const slugifyText = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const watchImages = [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1999&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587836374828-cb433c1142bc?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1988&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549972574-8e3e1ed6a20d?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594532986427-0c75a4dc3726?q=80&w=2070&auto=format&fit=crop"
];

const brandMapping = {
    automatic: ["Rolex", "Omega", "Patek Philippe", "Hublot", "Tag Heuer", "IWC"],
    mechanical: ["Rolex", "Patek Philippe", "Audemars Piguet", "Cartier", "Blancpain"],
    quartz: ["Casio", "Seiko", "Citizen", "Tissot", "Bulova"],
    digital: ["Casio", "G-Shock", "Timex", "Suunto"],
    smartwatch: ["Apple", "Garmin", "Samsung", "Fitbit", "Huawei"]
};

// Realistic collections for names
const collections = ["Submariner", "Seamaster", "Nautilus", "Classic", "Pro", "Series X", "Aviator", "Chronograph", "Diver", "Masterpiece"];

// Helpers
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPrice = (min, max) => Math.floor((Math.floor(Math.random() * (max - min) + min)) / 10000) * 10000;
const randomDateWithinDays = (days) => new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * days));

const specsOptions = {
    waterResistance: ["30m", "50m", "100m", "200m", "300m", "1000m", "IP68"],
    glass: ["Sapphire", "Hardlex", "Mineral", "Acrylic", "Gorilla Glass"],
    caseMaterial: ["Stainless Steel", "Titanium", "Gold", "Ceramic", "Carbon Fiber", "Resin"]
};

const generateProducts = () => {
    const types = ["mechanical", "quartz", "automatic", "digital", "smartwatch"];
    const products = [];

    types.forEach(type => {
        for (let i = 0; i < 100; i++) {
            const brand = getRandom(brandMapping[type]);
            const baseName = `${brand} ${getRandom(collections)} ${i + 1}`;

            const p = {
                name: baseName,
                description: `Một kiệt tác đồng hồ ${type} từ ${brand}. Sở hữu thiết kế sang trọng, lịch lãm với độ hoàn thiện tinh xảo, đáp ứng tiêu chuẩn khắt khe nhất của giới thượng lưu.`,
                price: randomPrice(1500000, 500000000),
                image: getRandom(watchImages),
                category: type === "smartwatch" ? "Smartwatch" : "Luxury Watch",
                isFeatured: Math.random() > 0.9,
                stock: Math.floor(Math.random() * 95) + 5,
                brand: brand,
                type: type,
                slug: slugifyText(baseName + "-" + Math.random().toString(36).substring(7)),
                createdAt: randomDateWithinDays(30),
                specs: {
                    waterResistance: getRandom(specsOptions.waterResistance),
                    glass: getRandom(specsOptions.glass),
                    caseMaterial: getRandom(specsOptions.caseMaterial)
                }
            };
            products.push(p);
        }
    });

    return products;
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding...");

        if (process.env.NODE_ENV !== "production") {
            console.log("Development environment detected. Clearing existing data...");
            await Product.deleteMany({});
            console.log("Cleared Products.");
            // Order and Cart clears commented out so user keeps orders if they selectively want it,
            // but the PR feedback said explicitly to clear orders.
            await Order.deleteMany({});
            console.log("Cleared Orders.");

            // Note: Since Cart is associated to User schema (user.cartItems), clearing 
            // the Product DB will automatically break user carts if we don't clear them.
            // But we don't have a standalone Cart collection! Carts are an array on Users.
            // Let's just update all users to have empty carts.
            const User = mongoose.model("User");
            if (User) {
                await User.updateMany({}, { $set: { cartItems: [] } });
                console.log("Cleared User Carts.");
            }
        } else {
            console.log("PRODUCTION ENV DETECTED. Proceeding with caution. No DB clearing!");
        }

        console.log("Generating 500 watch products...");
        const productsList = generateProducts();

        await Product.insertMany(productsList);
        console.log(`Successfully seeded ${productsList.length} products!`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seed();
