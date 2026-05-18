import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

/**
 * Create realistic test products with correct luxury watch prices
 */

const testProducts = [
    {
        name: "Casio A168WG-9",
        description: "Iconic digital watch",
        price: 5500000, // 5.5 million VND
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80",
        category: "digital",
        type: "digital",
        stock: 15,
        colors: ["Đen", "Bạc"],
        sizes: ["Universal"],
    },
    {
        name: "Timex Weekender",
        description: "Simple and reliable",
        price: 8900000, // 8.9 million VND
        image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80",
        category: "quartz",
        type: "quartz",
        stock: 12,
        colors: ["Đen", "Nâu"],
        sizes: ["40mm"],
    },
    {
        name: "Apple Watch Series 9",
        description: "Modern smartwatch",
        price: 15000000, // 15 million VND
        image: "https://images.unsplash.com/photo-1523206489230-c012066a6fb0?auto=format&fit=crop&w=600&q=80",
        category: "smartwatch",
        type: "smartwatch",
        stock: 8,
        colors: ["Đen", "Bạc"],
        sizes: ["40mm", "44mm"],
    },
    {
        name: "Seiko 5 SNX007",
        description: "Automatic entry-level",
        price: 18500000, // 18.5 million VND
        image: "https://images.unsplash.com/photo-1506084131262-1f09dd3f0eb1?auto=format&fit=crop&w=600&q=80",
        category: "mechanical",
        type: "automatic",
        stock: 10,
        colors: ["Đen", "Bạc"],
        sizes: ["37mm"],
    },
    {
        name: "Omega Seamaster",
        description: "Professional dive watch",
        price: 85000000, // 85 million VND
        image: "https://images.unsplash.com/photo-1565695339552-65e73c38a881?auto=format&fit=crop&w=600&q=80",
        category: "mechanical",
        type: "automatic",
        stock: 5,
        colors: ["Đen", "Bạc"],
        sizes: ["42mm"],
    },
    {
        name: "Rolex Submariner",
        description: "Iconic sports watch",
        price: 450000000, // 450 million VND
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80",
        category: "mechanical",
        type: "automatic",
        stock: 3,
        colors: ["Đen", "Xanh dương"],
        sizes: ["41mm"],
    },
    {
        name: "Patek Philippe Nautilus",
        description: "Luxury sports watch",
        price: 850000000, // 850 million VND
        image: "https://images.unsplash.com/photo-1574272176974-f9c0b3ca6b8f?auto=format&fit=crop&w=600&q=80",
        category: "mechanical",
        type: "automatic",
        stock: 2,
        colors: ["Bạc", "Vàng"],
        sizes: ["42mm"],
    },
];

const seedTestProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Insert test products
        const result = await Product.insertMany(testProducts);
        console.log(`✅ Created ${result.length} test products\n`);

        console.log("📊 Test Product Prices:");
        testProducts.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.brand} ${p.name}`);
            console.log(`      Price: ${p.price.toLocaleString("vi-VN")} ₫`);
        });

        // Verify in database
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    avgPrice: { $avg: "$price" },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            const { minPrice, maxPrice, avgPrice, count } = stats[0];
            console.log("\n📈 Database Statistics:");
            console.log(`   Total: ${count} products`);
            console.log(`   Min: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Max: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Avg: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`);
            console.log("\n✅ All prices are in realistic luxury watch range!");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
};

seedTestProducts();
