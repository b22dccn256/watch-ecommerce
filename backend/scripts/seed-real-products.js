import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";

const slugifyText = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const watchImages = [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1999&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587836374828-cb433c1142bc?q=80&w=2070&auto=format&fit=crop"
];
const getRandomImg = () => watchImages[Math.floor(Math.random() * watchImages.length)];

// Dữ liệu thật từ thị trường
const realCatalog = [
    {
        brand: "Rolex",
        type: "automatic",
        collections: [
            { name: "Submariner Date", refBase: "126610", basePrice: 280000000, dials: ["Đen (LN)", "Xanh lá (LV - Starbucks)"], sizes: ["41mm"], materials: ["Oystersteel"], glass: "Sapphire", wr: "300m" },
            { name: "Submariner No-Date", refBase: "124060", basePrice: 240000000, dials: ["Đen"], sizes: ["41mm"], materials: ["Oystersteel"], glass: "Sapphire", wr: "300m" },
            { name: "Daytona", refBase: "116500", basePrice: 650000000, dials: ["Trắng (Panda)", "Đen"], sizes: ["40mm"], materials: ["Oystersteel"], glass: "Sapphire", wr: "100m" },
            { name: "GMT-Master II", refBase: "126710", basePrice: 350000000, dials: ["Đen/Đỏ-Xanh (Pepsi)", "Đen/Đen-Xanh (Batman)", "Đen/Đen-Xanh lá (Sprite)"], sizes: ["40mm"], materials: ["Oystersteel"], glass: "Sapphire", wr: "100m" },
            { name: "Datejust 36", refBase: "126234", basePrice: 220000000, dials: ["Xanh Mint", "Xanh dương (Blue Motif)", "Đen", "Bạc", "Trắng", "Xám (Wimbledon)"], sizes: ["36mm"], materials: ["Rolesor (Thép/Vàng trắng)"], glass: "Sapphire", wr: "100m" },
            { name: "Oyster Perpetual", refBase: "124300", basePrice: 180000000, dials: ["Xanh ngọc (Tiffany)", "Đỏ Coral", "Vàng", "Xanh lá", "Bạc", "Đen"], sizes: ["41mm", "36mm"], materials: ["Oystersteel"], glass: "Sapphire", wr: "100m" }
        ]
    },
    {
        brand: "Omega",
        type: "automatic",
        collections: [
            { name: "Speedmaster Moonwatch Professional", refBase: "310.30.42.50.01", basePrice: 165000000, dials: ["Đen (Hesalite)", "Đen (Sapphire Sandwich)"], sizes: ["42mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "50m" },
            { name: "Seamaster Diver 300M", refBase: "210.30.42.20", basePrice: 135000000, dials: ["Xanh dương", "Đen", "Trắng", "Xanh lá", "Xám"], sizes: ["42mm"], materials: ["Stainless Steel", "Titanium"], glass: "Sapphire", wr: "300m" },
            { name: "Aqua Terra 150M", refBase: "220.10.41.21", basePrice: 145000000, dials: ["Xanh dương", "Xanh lá", "Đen", "Trắng (Saffron)"], sizes: ["41mm", "38mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "150m" },
            { name: "Planet Ocean 600M", refBase: "215.30.44.21", basePrice: 160000000, dials: ["Đen/Cam", "Xanh dương"], sizes: ["43.5mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "600m" }
        ]
    },
    {
        brand: "Casio",
        type: "digital",
        collections: [
            { name: "G-Shock Original", refBase: "DW-5600", basePrice: 1500000, dials: ["Đen viền đỏ (E-1V)", "Đen Full (BB-1)", "Trong suốt (SKE-7)"], sizes: ["42.8mm"], materials: ["Resin"], glass: "Mineral", wr: "200m" },
            { name: "G-Shock CasiOak", refBase: "GA-2100", basePrice: 2800000, dials: ["Đen Full (1A1)", "Đen viền trắng (1A)", "Xanh dương", "Trong suốt"], sizes: ["45.4mm"], materials: ["Resin/Carbon"], glass: "Mineral", wr: "200m" },
            { name: "Classic F-91W", refBase: "F-91W", basePrice: 400000, dials: ["Đen (1)", "Bạc (A158WA)", "Vàng (A168WG)"], sizes: ["35mm"], materials: ["Resin", "Stainless Steel"], glass: "Resin", wr: "30m" },
            { name: "Edifice Chronograph", refBase: "EFR-539", basePrice: 3500000, dials: ["Đen", "Xanh dương", "Trắng"], sizes: ["49mm"], materials: ["Stainless Steel"], glass: "Mineral", wr: "100m" }
        ]
    },
    {
        brand: "Seiko",
        type: "mechanical",
        collections: [
            { name: "5 Sports (SKX Style)", refBase: "SRPD", basePrice: 6500000, dials: ["Đen (55K1)", "Xanh dương (51K1)", "Xanh lá (61K1)", "Cam (59K1)", "Vàng hồng (76K1)"], sizes: ["42.5mm"], materials: ["Stainless Steel"], glass: "Hardlex", wr: "100m" },
            { name: "Prospex Diver (Turtle)", refBase: "SRP", basePrice: 10500000, dials: ["Đen (777)", "Xanh PADI (779)", "Xanh dương (773)"], sizes: ["45mm"], materials: ["Stainless Steel"], glass: "Hardlex", wr: "200m" },
            { name: "Presage Cocktail Time", refBase: "SRPB", basePrice: 11000000, dials: ["Xanh nhạt (Sky Diving)", "Xanh đậm (Blue Moon)", "Nâu (Manhattan)", "Bạc (Martini)"], sizes: ["40.5mm"], materials: ["Stainless Steel"], glass: "Hardlex", wr: "50m" },
            { name: "Alpinist", refBase: "SPB", basePrice: 18000000, dials: ["Xanh lá (121J1)", "Đen (117J1)", "Kem (119J1)"], sizes: ["39.5mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "200m" }
        ]
    },
    {
        brand: "Patek Philippe",
        type: "automatic",
        collections: [
            { name: "Nautilus", refBase: "5711/1A", basePrice: 1500000000, dials: ["Xanh dương (010)", "Xanh Olive (014)", "Trắng (011)"], sizes: ["40mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "120m" },
            { name: "Aquanaut", refBase: "5167A", basePrice: 950000000, dials: ["Đen", "Xanh Khaki (5168G)"], sizes: ["40mm", "42.2mm"], materials: ["Stainless Steel", "White Gold"], glass: "Sapphire", wr: "120m" },
            { name: "Calatrava", refBase: "5227", basePrice: 750000000, dials: ["Ngà (Ivory)", "Đen"], sizes: ["39mm"], materials: ["Yellow Gold", "Rose Gold", "White Gold"], glass: "Sapphire", wr: "30m" },
            { name: "Nautilus Chronograph", refBase: "5980/1R", basePrice: 2200000000, dials: ["Đen Gradient", "Xanh dương"], sizes: ["40.5mm"], materials: ["Rose Gold"], glass: "Sapphire", wr: "120m" }
        ]
    },
    {
        brand: "Audemars Piguet",
        type: "automatic",
        collections: [
            { name: "Royal Oak Selfwinding", refBase: "15500ST", basePrice: 1200000000, dials: ["Xanh dương", "Đen", "Xám Ruthenium", "Trắng bạc"], sizes: ["41mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "50m" },
            { name: "Royal Oak Offshore Diver", refBase: "15720ST", basePrice: 650000000, dials: ["Xanh Khaki", "Xanh Navy", "Xám"], sizes: ["42mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "300m" },
            { name: "Royal Oak Jumbo Extra-Thin", refBase: "15202ST", basePrice: 1800000000, dials: ["Xanh Petite Tapisserie"], sizes: ["39mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "50m" }
        ]
    },
    {
        brand: "Cartier",
        type: "mechanical",
        collections: [
            { name: "Santos de Cartier", refBase: "WSSA", basePrice: 180000000, dials: ["Trắng La Mã", "Xanh dương Gradient", "Đen"], sizes: ["Medium", "Large"], materials: ["Stainless Steel", "Steel/ADLC"], glass: "Sapphire", wr: "100m" },
            { name: "Tank Must", refBase: "WSTA", basePrice: 85000000, dials: ["Trắng La Mã", "Xanh lá (Limited)", "Đỏ Burgundy", "Đen (Onyx)"], sizes: ["Small", "Large", "Extra-Large"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "30m" },
            { name: "Ballon Bleu de Cartier", refBase: "WSBB", basePrice: 160000000, dials: ["Trắng Guilloché", "Xanh dương", "Xám đen"], sizes: ["33mm", "36mm", "40mm", "42mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "30m" }
        ]
    },
    {
        brand: "Tissot",
        type: "automatic",
        collections: [
            { name: "PRX Powermatic 80", refBase: "T137.407", basePrice: 18500000, dials: ["Xanh dương", "Đen", "Xanh lá", "Trắng (Mặt xà cừ)", "Xanh Ice Blue"], sizes: ["40mm", "35mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "100m" },
            { name: "Le Locle Powermatic 80", refBase: "T006.407", basePrice: 16500000, dials: ["Trắng La Mã", "Đen La Mã", "Vàng hồng", "Mặt kim cương"], sizes: ["39.3mm"], materials: ["Stainless Steel", "PVD Gold"], glass: "Sapphire", wr: "30m" },
            { name: "Seastar 1000", refBase: "T120.407", basePrice: 21500000, dials: ["Xanh dương Gradient", "Đen", "Xanh lá"], sizes: ["43mm", "40mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "300m" },
            { name: "Chemin des Tourelles", refBase: "T099.407", basePrice: 22000000, dials: ["Xanh dương", "Trắng", "Xám đen"], sizes: ["42mm", "39mm"], materials: ["Stainless Steel"], glass: "Sapphire", wr: "50m" }
        ]
    },
    {
        brand: "Hublot",
        type: "automatic",
        collections: [
            { name: "Classic Fusion", refBase: "511.NX", basePrice: 180000000, dials: ["Đen mờ", "Xanh dương (Blue Sunray)", "Xám Titan", "Xanh lá"], sizes: ["45mm", "42mm", "38mm"], materials: ["Titanium", "Ceramic", "King Gold"], glass: "Sapphire", wr: "50m" },
            { name: "Big Bang Unico", refBase: "441.NM", basePrice: 480000000, dials: ["Khung xương (Skeleton) Đen", "Khung xương Xanh"], sizes: ["42mm", "44mm"], materials: ["Titanium/Ceramic", "Magic Gold"], glass: "Sapphire", wr: "100m" },
            { name: "Spirit of Big Bang", refBase: "601.NX", basePrice: 550000000, dials: ["Skeleton Đen", "Skeleton Trắng"], sizes: ["45mm", "42mm"], materials: ["Titanium", "Ceramic"], glass: "Sapphire", wr: "100m" }
        ]
    }
];

const generateProductsList = () => {
    let products = [];
    
    // Tạo data cho 9 hãng
    for (const brandData of realCatalog) {
        for (const coll of brandData.collections) {
            // Tổ hợp các dial, size, material để tạo ra 30-60 model/hãng
            for (const dial of coll.dials) {
                for (const size of coll.sizes) {
                    for (const material of coll.materials) {
                        let name = `${brandData.brand} ${coll.name}`;
                        // Biến thiên giá dựa trên material/size
                        let variance = 1;
                        if (material.includes("Gold") || material.includes("Ceramic")) variance += 0.3;
                        if (size.includes("44") || size.includes("45")) variance += 0.05;

                        // Các model ngưng sản xuất sẽ có stock = 0
                        const isDiscontinued = dial.includes("Ngưng sản xuất") || dial.includes("Hulk") || coll.refBase.includes("116500") || coll.refBase.includes("15202") || coll.refBase.includes("5711");
                        const stock = isDiscontinued ? 0 : Math.floor(Math.random() * 20) + 1;
                        
                        const p = {
                            name: name,
                            description: `Đồng hồ ${brandData.brand} ${coll.name} chính hãng. Mã ref base: ${coll.refBase}. Đây là một mẫu đồng hồ ${brandData.type} hoàn hảo, trang bị mặt số màu ${dial}, kích thước ${size}, hoàn thiện từ ${material}. Trạng thái: ${isDiscontinued ? 'Đã ngưng sản xuất' : 'Đang bán'}.`,
                            price: Math.round((coll.basePrice * variance) / 10000) * 10000,
                            image: getRandomImg(),
                            category: brandData.type === "smartwatch" ? "Smartwatch" : "Luxury Watch",
                            isFeatured: Math.random() > 0.8,
                            stock: stock,
                            lowStockThreshold: 2,
                            salesCount: Math.floor(Math.random() * 500),
                            brand: brandData.brand,
                            type: brandData.type,
                            slug: slugifyText(name + "-" + Math.random().toString(36).substring(7)),
                            createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 60)),
                            colors: [dial.split(" ")[0]],
                            sizes: [size],
                            specs: {
                                waterResistance: coll.wr,
                                glass: coll.glass,
                                caseMaterial: material
                            }
                        };
                        products.push(p);
                    }
                }
            }
        }
    }
    return products;
};

const seedReal = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding Real Watches...");

        console.log("Clearing old AI-generated products...");
        await Product.deleteMany({});
        console.log("Cleared Products.");

        // Lấy danh sách ID của các thương hiệu hiện có, tạo mới nếu thiếu
        const brandIdMap = {};
        for (const brandData of realCatalog) {
            const b = await Brand.findOneAndUpdate(
                { name: brandData.brand },
                { $setOnInsert: { name: brandData.brand, logo: "", description: "" } },
                { upsert: true, new: true }
            );
            brandIdMap[b.name] = b._id;
        }

        const rawProducts = generateProductsList();
        
        // Gắn brand ID
        const finalProducts = rawProducts.map(p => ({
            ...p,
            brand: brandIdMap[p.brand] || null
        }));

        await Product.insertMany(finalProducts);
        
        console.log(`===========================================`);
        console.log(`✅ THÀNH CÔNG! Đã nạp ${finalProducts.length} sản phẩm đồng hồ THẬT vào DB.`);
        
        // Đếm thử số lượng mỗi hãng
        const counts = {};
        for(const p of finalProducts) {
            counts[p.brand] = (counts[p.brand] || 0) + 1;
        }
        console.log("Thống kê theo hãng:");
        for(const [bId, count] of Object.entries(counts)) {
            const bName = Object.keys(brandIdMap).find(k => brandIdMap[k] === bId);
            console.log(`- ${bName}: ${count} sản phẩm`);
        }
        console.log(`===========================================`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedReal();
