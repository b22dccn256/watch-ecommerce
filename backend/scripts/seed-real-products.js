import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";

const watchImages = [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587836374828-cb433c1142bc?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1619134778706-7015533a6150?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539874754764-5a96559165b0?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1623998021450-85c24c626a5a?q=80&w=600&auto=format&fit=crop"
];

const getWatchImg = (index) => watchImages[index % watchImages.length];

// Helper to generate multiple realistic dial colors based on a primary color
const getRealisticColors = (primaryColor) => {
    if (primaryColor === "Đen") return ["Đen huyền bí", "Xanh dương sâu", "Trắng bạc"];
    if (primaryColor === "Trắng") return ["Trắng bạc", "Đen cổ điển", "Xanh dương"];
    if (primaryColor === "Xanh dương") return ["Xanh dương chải tia", "Đen", "Xám Slate"];
    if (primaryColor === "Vàng hồng") return ["Vàng hồng 18k", "Vàng vàng", "Champagne"];
    if (primaryColor === "Bạc") return ["Trắng bạc", "Xám khói", "Đen"];
    if (primaryColor === "Xám") return ["Xám không gian", "Đen", "Trắng"];
    if (primaryColor === "Xanh lá") return ["Xanh lá lục bảo", "Đen", "Xanh dương"];
    return [primaryColor, "Đen cổ điển", "Trắng bạc"];
};

// Helper to generate multiple size options based on standard size
const getRealisticSizes = (baseSize, gender) => {
    if (gender === "female") {
        if (baseSize === "28mm" || baseSize === "26mm") return ["26mm", "28mm", "31mm"];
        return ["32mm", "34mm"];
    }
    if (baseSize === "40mm" || baseSize === "41mm" || baseSize === "42mm") return ["39mm", "41mm", "42mm"];
    if (baseSize === "44mm" || baseSize === "45mm") return ["42mm", "44mm", "45mm"];
    return [baseSize];
};

// 13 active brands with exactly 10 models each = 130 products total
const rawDataset = [
    // 1. HUBLOT
    {
        brand: "Hublot",
        models: [
            { name: "Hublot Classic Fusion Titanium Blue", gender: "male", type: "automatic", price: 185000000, size: "42mm", color: "Xanh dương", material: "Titanium", wr: "50m", glass: "Sapphire" },
            { name: "Hublot Big Bang Steel Diamonds", gender: "female", type: "quartz", price: 290000000, size: "38mm", color: "Trắng", material: "Thép/Kim cương", wr: "100m", glass: "Sapphire" },
            { name: "Hublot Classic Fusion Black Magic", gender: "male", type: "automatic", price: 210000000, size: "45mm", color: "Đen", material: "Ceramic", wr: "50m", glass: "Sapphire" },
            { name: "Hublot Spirit of Big Bang King Gold", gender: "male", type: "automatic", price: 580000000, size: "42mm", color: "Vàng hồng", material: "Vàng 18k", wr: "100m", glass: "Sapphire" },
            { name: "Hublot Classic Fusion Orlinski Titanium", gender: "unisex", type: "automatic", price: 245000000, size: "40mm", color: "Bạc", material: "Titanium", wr: "50m", glass: "Sapphire" },
            { name: "Hublot Big Bang One Click Steel White", gender: "female", type: "quartz", price: 320000000, size: "39mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Hublot Classic Fusion Racing Grey", gender: "female", type: "automatic", price: 165000000, size: "38mm", color: "Xám", material: "Titanium", wr: "50m", glass: "Sapphire" },
            { name: "Hublot Big Bang Sang Bleu II Titanium", gender: "male", type: "automatic", price: 490000000, size: "45mm", color: "Xám", material: "Titanium", wr: "100m", glass: "Sapphire" },
            { name: "Hublot Classic Fusion Gold Opalin", gender: "male", type: "automatic", price: 420000000, size: "42mm", color: "Vàng hồng", material: "King Gold", wr: "50m", glass: "Sapphire" },
            { name: "Hublot Big Bang Soul of Big Bang", gender: "unisex", type: "automatic", price: 360000000, size: "39mm", color: "Đen", material: "Ceramic/Titanium", wr: "100m", glass: "Sapphire" }
        ]
    },
    // 2. AUDEMARS PIGUET
    {
        brand: "Audemars Piguet",
        models: [
            { name: "Audemars Piguet Royal Oak Selfwinding 15500ST Blue", gender: "male", type: "automatic", price: 920000000, size: "41mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Offshore Diver 15720ST", gender: "male", type: "automatic", price: 690000000, size: "42mm", color: "Xanh lá", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Quartz Pink Gold", gender: "female", type: "quartz", price: 620000000, size: "33mm", color: "Vàng hồng", material: "Vàng hồng 18k", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Jumbo Extra-Thin 16202ST", gender: "male", type: "automatic", price: 1550000000, size: "39mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Selfwinding Chronograph 41mm", gender: "male", type: "automatic", price: 1100000000, size: "41mm", color: "Đen", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Double Balance Wheel Openworked", gender: "male", type: "automatic", price: 2400000000, size: "41mm", color: "Đen", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Quartz White Dial", gender: "female", type: "quartz", price: 420000000, size: "33mm", color: "Trắng", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Concept Flying Tourbillon", gender: "male", type: "automatic", price: 3900000000, size: "44mm", color: "Đen", material: "Titanium/Ceramic", wr: "100m", glass: "Sapphire" },
            { name: "Audemars Piguet Code 11.59 Selfwinding 41mm", gender: "unisex", type: "automatic", price: 680000000, size: "41mm", color: "Xanh dương", material: "Vàng trắng 18k", wr: "30m", glass: "Sapphire" },
            { name: "Audemars Piguet Royal Oak Selfwinding 34mm Blue Dial", gender: "female", type: "automatic", price: 710000000, size: "34mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" }
        ]
    },
    // 3. PANERAI
    {
        brand: "Panerai",
        models: [
            { name: "Panerai Luminor Marina PAM01312", gender: "male", type: "automatic", price: 195000000, size: "44mm", color: "Đen", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Panerai Submersible QuarantaQuattro PAM01229", gender: "male", type: "automatic", price: 220000000, size: "44mm", color: "Đen", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Panerai Radiomir Officine PAM01385", gender: "male", type: "mechanical", price: 135000000, size: "45mm", color: "Bạc", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Panerai Luminor Due 38mm PAM01273", gender: "female", type: "automatic", price: 162000000, size: "38mm", color: "Xanh dương", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Panerai Luminor Chrono PAM01218", gender: "male", type: "automatic", price: 235000000, size: "44mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Panerai Luminor Due 42mm PAM01124", gender: "unisex", type: "automatic", price: 180000000, size: "42mm", color: "Xanh dương", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Panerai Radiomir California PAM01349", gender: "male", type: "mechanical", price: 285000000, size: "47mm", color: "Xanh lá", material: "Thép cũ eSteel", wr: "100m", glass: "Sapphire" },
            { name: "Panerai Luminor Base Logo PAM01086", gender: "male", type: "mechanical", price: 125000000, size: "44mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Panerai Luminor Due 38mm PAM01248", gender: "female", type: "automatic", price: 158000000, size: "38mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Panerbai Submersible Goldtech PAM01070", gender: "male", type: "automatic", price: 890000000, size: "44mm", color: "Đen", material: "Vàng Goldtech", wr: "300m", glass: "Sapphire" }
        ]
    },
    // 4. TAG HEUER
    {
        brand: "TAG Heuer",
        models: [
            { name: "TAG Heuer Carrera Calibre 5 Day-Date", gender: "male", type: "automatic", price: 72000000, size: "41mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "TAG Heuer Monaco Calibre Heuer 02", gender: "male", type: "automatic", price: 185000000, size: "39mm", color: "Xanh dương", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "TAG Heuer Aquaracer Professional 300", gender: "male", type: "automatic", price: 85000000, size: "43mm", color: "Xanh dương", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "TAG Heuer Formula 1 Quartz Chronograph", gender: "male", type: "quartz", price: 48000000, size: "43mm", color: "Đen", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "TAG Heuer Link Quartz 32mm Mother of Pearl", gender: "female", type: "quartz", price: 65000000, size: "32mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "TAG Heuer Carrera Ladies Automatic 36mm", gender: "female", type: "automatic", price: 78000000, size: "36mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "TAG Heuer Formula 1 Lady Steel & Ceramic", gender: "female", type: "quartz", price: 58000000, size: "32mm", color: "Trắng", material: "Thép/Ceramic", wr: "200m", glass: "Sapphire" },
            { name: "TAG Heuer Aquaracer Professional 200 Solargraph", gender: "unisex", type: "quartz", price: 75000000, size: "40mm", color: "Đen", material: "Titanium", wr: "200m", glass: "Sapphire" },
            { name: "TAG Heuer Autavia Heritage Calibre 5", gender: "male", type: "automatic", price: 92000000, size: "42mm", color: "Xám", material: "Bronze", wr: "100m", glass: "Sapphire" },
            { name: "TAG Heuer Monaco Quartz 37mm Brown Dial", gender: "unisex", type: "quartz", price: 62000000, size: "37mm", color: "Bạc", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" }
        ]
    },
    // 5. TUDOR
    {
        brand: "Tudor",
        models: [
            { name: "Tudor Black Bay 58 Black/Gilt", gender: "male", type: "automatic", price: 92000000, size: "39mm", color: "Đen", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Tudor Black Bay GMT 'Pepsi'", gender: "male", type: "automatic", price: 105000000, size: "41mm", color: "Xanh dương", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Tudor Pelagos 39 Titanium", gender: "male", type: "automatic", price: 115000000, size: "39mm", color: "Đen", material: "Titanium", wr: "200m", glass: "Sapphire" },
            { name: "Tudor Royal 28mm Diamond Dial", gender: "female", type: "automatic", price: 68000000, size: "28mm", color: "Trắng", material: "Thép/Vàng", wr: "100m", glass: "Sapphire" },
            { name: "Tudor Black Bay 54 37mm", gender: "unisex", type: "automatic", price: 90000000, size: "37mm", color: "Đen", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Tudor 1926 Opaline/Blue 39mm", gender: "male", type: "automatic", price: 54000000, size: "39mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Tudor Clair de Rose 26mm Opaline Dial", gender: "female", type: "quartz", price: 48000000, size: "26mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Tudor Black Bay Chrono Panda", gender: "male", type: "automatic", price: 135000000, size: "41mm", color: "Trắng", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Tudor Royal 41mm Blue Dial", gender: "male", type: "automatic", price: 62000000, size: "41mm", color: "Xanh dương", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Tudor 1926 28mm Silver/Gold Dial", gender: "female", type: "automatic", price: 56000000, size: "28mm", color: "Bạc", material: "Thép/Vàng", wr: "100m", glass: "Sapphire" }
        ]
    },
    // 6. BREITLING
    {
        brand: "Breitling",
        models: [
            { name: "Breitling Navitimer B01 Chronograph 43", gender: "male", type: "automatic", price: 215000000, size: "43mm", color: "Đen", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Breitling Superocean Automatic 42", gender: "male", type: "automatic", price: 118000000, size: "42mm", color: "Xanh lá", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Breitling Chronomat GMT 40", gender: "male", type: "automatic", price: 138000000, size: "40mm", color: "Xanh dương", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Breitling Navitimer 32 Mother of Pearl", gender: "female", type: "quartz", price: 105000000, size: "32mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Breitling Superocean Heritage '57", gender: "unisex", type: "automatic", price: 125000000, size: "38mm", color: "Đen", material: "Thép/Vàng hồng", wr: "100m", glass: "Sapphire" },
            { name: "Breitling Avenger Automatic 43", gender: "male", type: "automatic", price: 98000000, size: "43mm", color: "Xanh lá", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Breitling Chronomat 32 Steel & Gold", gender: "female", type: "quartz", price: 165000000, size: "32mm", color: "Trắng", material: "Thép/Vàng 18k", wr: "100m", glass: "Sapphire" },
            { name: "Breitling Premier B01 Chronograph 42", gender: "male", type: "automatic", price: 195000000, size: "42mm", color: "Vàng hồng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Breitling Navitimer 36 Mint Green", gender: "female", type: "automatic", price: 128000000, size: "36mm", color: "Xanh lá", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Breitling Top Time Deus Limited Edition", gender: "male", type: "automatic", price: 175000000, size: "41mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" }
        ]
    },
    // 7. PATEK PHILIPPE
    {
        brand: "Patek Philippe",
        models: [
            { name: "Patek Philippe Nautilus 5711/1A Blue Dial", gender: "male", type: "automatic", price: 1650000000, size: "40mm", color: "Xanh dương", material: "Thép không gỉ", wr: "120m", glass: "Sapphire" },
            { name: "Patek Philippe Aquanaut 5167A Black Dial", gender: "male", type: "automatic", price: 980000000, size: "40mm", color: "Đen", material: "Thép không gỉ", wr: "120m", glass: "Sapphire" },
            { name: "Patek Philippe Calatrava 5227J Gold", gender: "male", type: "automatic", price: 780000000, size: "39mm", color: "Trắng", material: "Vàng vàng 18k", wr: "30m", glass: "Sapphire" },
            { name: "Patek Philippe Twenty~4 Quartz Medium Grey Dial", gender: "female", type: "quartz", price: 350000000, size: "28mm", color: "Xám", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Patek Philippe Nautilus 7118/1A Ladies Blue", gender: "female", type: "automatic", price: 890000000, size: "35mm", color: "Xanh dương", material: "Thép không gỉ", wr: "60m", glass: "Sapphire" },
            { name: "Patek Philippe Aquanaut Luce Quartz White", gender: "female", type: "quartz", price: 540000000, size: "35.6mm", color: "Trắng", material: "Thép/Kim cương", wr: "120m", glass: "Sapphire" },
            { name: "Patek Philippe Golden Ellipse 5738R Rose Gold", gender: "unisex", type: "automatic", price: 920000000, size: "39.5mm", color: "Đen", material: "Vàng hồng 18k", wr: "30m", glass: "Sapphire" },
            { name: "Patek Philippe Nautilus Chronograph 5980/1R", gender: "male", type: "automatic", price: 2350000000, size: "40.5mm", color: "Đen", material: "Vàng hồng 18k", wr: "120m", glass: "Sapphire" },
            { name: "Patek Philippe Calatrava Weekly Calendar 5212G", gender: "male", type: "automatic", price: 850000000, size: "40mm", color: "Bạc", material: "Vàng trắng 18k", wr: "30m", glass: "Sapphire" },
            { name: "Patek Philippe Twenty~4 Automatic Chocolate Dial", gender: "female", type: "automatic", price: 680000000, size: "36mm", color: "Vàng hồng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" }
        ]
    },
    // 8. ROLEX
    {
        brand: "Rolex",
        models: [
            { name: "Rolex Submariner Date 126610LN", gender: "male", type: "automatic", price: 320000000, size: "41mm", color: "Đen", material: "Thép Oystersteel", wr: "300m", glass: "Sapphire" },
            { name: "Rolex Cosmograph Daytona 126500LN White", gender: "male", type: "automatic", price: 710000000, size: "40mm", color: "Trắng", material: "Thép Oystersteel", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Datejust 36 126234 Mint Green", gender: "unisex", type: "automatic", price: 235000000, size: "36mm", color: "Xanh lá", material: "Thép Oystersteel", wr: "100m", glass: "Sapphire" },
            { name: "Rolex GMT-Master II 126710BLRO Pepsi", gender: "male", type: "automatic", price: 385000000, size: "40mm", color: "Xanh dương", material: "Thép Oystersteel", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Explorer 36 124270", gender: "unisex", type: "automatic", price: 185000000, size: "36mm", color: "Đen", material: "Thép Oystersteel", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Oyster Perpetual 41 Tiffany Blue", gender: "male", type: "automatic", price: 195000000, size: "41mm", color: "Xanh dương", material: "Thép Oystersteel", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Lady-Datejust 28 Yellow Gold/Diamonds", gender: "female", type: "automatic", price: 540000000, size: "28mm", color: "Champagne", material: "Vàng 18k/Kim cương", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Datejust 31 278274 Purple Dial", gender: "female", type: "automatic", price: 225000000, size: "31mm", color: "Xám", material: "Thép/Vàng trắng", wr: "100m", glass: "Sapphire" },
            { name: "Rolex Sea-Dweller Deepsea 136660", gender: "male", type: "automatic", price: 345000000, size: "44mm", color: "Xanh dương", material: "Thép Oystersteel", wr: "3900m", glass: "Sapphire" },
            { name: "Rolex Lady-Datejust 28 Steel/White Gold", gender: "female", type: "quartz", price: 198000000, size: "28mm", color: "Trắng", material: "Thép/Vàng trắng", wr: "100m", glass: "Sapphire" }
        ]
    },
    // 9. LONGINES
    {
        brand: "Longines",
        models: [
            { name: "Longines Master Collection L2.793.4", gender: "male", type: "automatic", price: 56000000, size: "40mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Longines Spirit Zulu Time GMT", gender: "male", type: "automatic", price: 82000000, size: "42mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Longines HydroConquest 41mm Ceramic Blue", gender: "male", type: "automatic", price: 42000000, size: "41mm", color: "Xanh dương", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Longines DolceVita Quartz Steel/Diamonds", gender: "female", type: "quartz", price: 46000000, size: "32mm", color: "Bạc", material: "Thép/Kim cương", wr: "30m", glass: "Sapphire" },
            { name: "Longines Legend Diver 39mm", gender: "unisex", type: "automatic", price: 78000000, size: "39mm", color: "Đen", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Longines Master Collection Ladies Automatic", gender: "female", type: "automatic", price: 62000000, size: "29mm", color: "Xanh dương", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Longines Record Collection Chronometer", gender: "male", type: "automatic", price: 72000000, size: "40mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Longines Elegant Collection 29mm", gender: "female", type: "automatic", price: 58000000, size: "29mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "Longines HydroConquest Quartz Chrono 43mm", gender: "male", type: "quartz", price: 38000000, size: "43mm", color: "Đen", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Longines DolceVita Quartz Mens Rectangular", gender: "unisex", type: "quartz", price: 34000000, size: "47mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" }
        ]
    },
    // 10. SEIKO
    {
        brand: "Seiko",
        models: [
            { name: "Seiko Prospex 'Alpinist' SPB121J1", gender: "male", type: "automatic", price: 18500000, size: "39.5mm", color: "Xanh lá", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Seiko 5 Sports SRPD55K1", gender: "male", type: "automatic", price: 6500000, size: "42.5mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Hardlex" },
            { name: "Seiko Presage 'Cocktail Time' SRPB41J1", gender: "male", type: "automatic", price: 11000000, size: "40.5mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Hardlex" },
            { name: "Seiko King Seiko KSK SJE087", gender: "male", type: "automatic", price: 82000000, size: "38.1mm", color: "Bạc", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Seiko Presage Ladies Automatic SRP841J1", gender: "female", type: "automatic", price: 10500000, size: "33.8mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Hardlex" },
            { name: "Seiko Prospex Diver 'Sumo' SPB321J1", gender: "male", type: "automatic", price: 24500000, size: "45mm", color: "Xanh dương", material: "Thép không gỉ", wr: "200m", glass: "Sapphire" },
            { name: "Seiko Quartz Chronograph SSB379P1", gender: "male", type: "quartz", price: 5800000, size: "41.5mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Hardlex" },
            { name: "Seiko Ladies Quartz Diamonds SWR064P1", gender: "female", type: "quartz", price: 7200000, size: "28mm", color: "Trắng", material: "Vàng PVD", wr: "30m", glass: "Hardlex" },
            { name: "Seiko Presage Sharp Edged GMT SPB217J1", gender: "male", type: "automatic", price: 34000000, size: "42.2mm", color: "Xanh dương", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Seiko 5 Sports Ladies 28mm", gender: "female", type: "automatic", price: 6800000, size: "28mm", color: "Trắng", material: "Thép không gỉ", wr: "100m", glass: "Hardlex" }
        ]
    },
    // 11. OMEGA
    {
        brand: "Omega",
        models: [
            { name: "Omega Speedmaster Moonwatch Professional", gender: "male", type: "automatic", price: 175000000, size: "42mm", color: "Đen", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Omega Seamaster Diver 300M Blue Dial", gender: "male", type: "automatic", price: 135000000, size: "42mm", color: "Xanh dương", material: "Thép không gỉ", wr: "300m", glass: "Sapphire" },
            { name: "Omega Constellation Co-Axial 39mm", gender: "unisex", type: "automatic", price: 165000000, size: "39mm", color: "Trắng", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "Omega Speedmaster 38 Co-Axial Ladies", gender: "female", type: "automatic", price: 142000000, size: "38mm", color: "Xám", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "Omega Seamaster Aqua Terra 150M Green", gender: "male", type: "automatic", price: 145000000, size: "41mm", color: "Xanh lá", material: "Thép không gỉ", wr: "150m", glass: "Sapphire" },
            { name: "Omega Constellation Quartz 28mm Diamond Dial", gender: "female", type: "quartz", price: 110000000, size: "28mm", color: "Trắng", material: "Thép/Kim cương", wr: "30m", glass: "Sapphire" },
            { name: "Omega Seamaster Planet Ocean 600M", gender: "male", type: "automatic", price: 168000000, size: "43.5mm", color: "Đen", material: "Thép không gỉ", wr: "600m", glass: "Sapphire" },
            { name: "Omega De Ville Prestige Quartz 27.4mm", gender: "female", type: "quartz", price: 78000000, size: "27.4mm", color: "Vàng hồng", material: "Thép/Vàng 18k", wr: "30m", glass: "Sapphire" },
            { name: "Omega Seamaster Aqua Terra Terra Cotta", gender: "unisex", type: "automatic", price: 152000000, size: "38mm", color: "Vàng hồng", material: "Thép không gỉ", wr: "150m", glass: "Sapphire" },
            { name: "Omega Speedmaster Chronoscope Co-Axial", gender: "male", type: "automatic", price: 215000000, size: "43mm", color: "Bạc", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" }
        ]
    },
    // 12. IWC
    {
        brand: "IWC",
        models: [
            { name: "IWC Portugieser Chronograph IW371605", gender: "male", type: "automatic", price: 215000000, size: "41mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "IWC Pilot's Watch Mark XX IW328201", gender: "male", type: "automatic", price: 135000000, size: "40mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "IWC Portofino Automatic 40 IW356802", gender: "male", type: "automatic", price: 118000000, size: "40mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "IWC Portofino Automatic 34 Ladies", gender: "female", type: "automatic", price: 132000000, size: "34mm", color: "Xanh lá", material: "Thép/Kim cương", wr: "30m", glass: "Sapphire" },
            { name: "IWC Portugieser Automatic 40 IW358304", gender: "unisex", type: "automatic", price: 185000000, size: "40mm", color: "Trắng", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "IWC Pilot's Watch Chronograph 41", gender: "male", type: "automatic", price: 178000000, size: "41mm", color: "Xanh dương", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "IWC Portofino Quartz 34 Silver Dial", gender: "female", type: "quartz", price: 105000000, size: "34mm", color: "Bạc", material: "Thép không gỉ", wr: "30m", glass: "Sapphire" },
            { name: "IWC Big Pilot's Watch 43 IW329301", gender: "male", type: "automatic", price: 220000000, size: "43mm", color: "Đen", material: "Thép không gỉ", wr: "100m", glass: "Sapphire" },
            { name: "IWC Portofino Automatic 37 Blue Dial", gender: "unisex", type: "automatic", price: 145000000, size: "37mm", color: "Xanh dương", material: "Thép không gỉ", wr: "50m", glass: "Sapphire" },
            { name: "IWC Portofino Quartz 34 Mother of Pearl", gender: "female", type: "quartz", price: 125000000, size: "34mm", color: "Trắng", material: "Thép/Kim cương", wr: "30m", glass: "Sapphire" }
        ]
    },
    // 13. CASIO
    {
        brand: "Casio",
        models: [
            { name: "Casio G-Shock DW-5600E-1V Digital", gender: "unisex", type: "quartz", price: 1800000, size: "42.8mm", color: "Đen", material: "Nhựa Resin", wr: "200m", glass: "Mineral" },
            { name: "Casio G-Shock 'CasiOak' GA-2100-1A1", gender: "male", type: "quartz", price: 2900000, size: "45.4mm", color: "Đen", material: "Nhựa Resin/Carbon", wr: "200m", glass: "Mineral" },
            { name: "Casio Classic F-91W-1DG Digital", gender: "unisex", type: "quartz", price: 450000, size: "35mm", color: "Đen", material: "Nhựa Resin", wr: "30m", glass: "Acrylic" },
            { name: "Casio Edifice Chronograph EFR-539D", gender: "male", type: "quartz", price: 3800000, size: "49mm", color: "Bạc", material: "Thép không gỉ", wr: "100m", glass: "Mineral" },
            { name: "Casio Vintage Calculator CA-53W-1Z", gender: "unisex", type: "quartz", price: 850000, size: "35mm", color: "Đen", material: "Nhựa Resin", wr: "30m", glass: "Acrylic" },
            { name: "Casio General Mens Analog MTP-1374D", gender: "male", type: "quartz", price: 2200000, size: "43.5mm", color: "Bạc", material: "Thép không gỉ", wr: "50m", glass: "Mineral" },
            { name: "Casio General Ladies Analog LTP-V007L", gender: "female", type: "quartz", price: 950000, size: "31mm", color: "Trắng", material: "Thép/Dây Da", wr: "30m", glass: "Mineral" },
            { name: "Casio Sheen Elegant Ladies SHE-4543BD", gender: "female", type: "quartz", price: 3500000, size: "30mm", color: "Vàng hồng", material: "Thép mạ vàng PVD", wr: "50m", glass: "Sapphire" },
            { name: "Casio G-Shock Women GM-S2100", gender: "female", type: "quartz", price: 4600000, size: "40.4mm", color: "Xám", material: "Nhựa Resin/Vỏ kim loại", wr: "200m", glass: "Mineral" },
            { name: "Casio Pro Trek Triple Sensor PRG-270", gender: "male", type: "quartz", price: 5800000, size: "52.4mm", color: "Đen", material: "Nhựa Resin", wr: "100m", glass: "Mineral" }
        ]
    }
];

const seedRealProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding 130 Real Watches with Multiple Options...");

        console.log("1. Clearing existing products in DB...");
        await Product.deleteMany({});
        console.log("Existing products deleted.");

        console.log("2. Syncing 13 target brands (upserting active brands)...");
        const brandIdMap = {};
        for (const brandGroup of rawDataset) {
            const existingBrand = await Brand.findOneAndUpdate(
                { name: new RegExp(`^${brandGroup.brand}$`, "i") },
                { 
                    $set: { 
                        name: brandGroup.brand, 
                        logo: "", 
                        description: `Đồng hồ thương hiệu ${brandGroup.brand} chính hãng chất lượng cao.` 
                    } 
                },
                { upsert: true, new: true }
            );
            brandIdMap[brandGroup.brand] = existingBrand._id;
        }

        console.log("3. Fetching 9 categories to build the slug mapping...");
        const categories = await Category.find({});
        console.log(`Found ${categories.length} categories in the DB.`);
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.slug] = cat._id;
        });

        console.log("4. Compiling the 130 products with Rich Selection Options...");
        const finalProductsList = [];
        let index = 0;

        for (const brandGroup of rawDataset) {
            const brandId = brandIdMap[brandGroup.brand];
            for (const model of brandGroup.models) {
                // Determine target category slug
                let targetSlug = "";
                const isAutoOrMech = model.type === "automatic" || model.type === "mechanical";
                
                if (model.gender === "male") {
                    targetSlug = isAutoOrMech ? "dong-ho-nam-automatic" : "dong-ho-nam-quartz";
                } else if (model.gender === "female") {
                    targetSlug = isAutoOrMech ? "dong-ho-nu-automatic" : "dong-ho-nu-quartz";
                } else {
                    targetSlug = isAutoOrMech ? "dong-ho-unisex-automatic" : "dong-ho-unisex-quartz";
                }

                const categoryId = categoryMap[targetSlug];
                
                // Calculate costPrice strictly satisfying price >= costPrice validation
                const costPrice = Math.round(model.price * 0.65);

                // Generate rich selections
                const richColors = getRealisticColors(model.color);
                const richSizes = getRealisticSizes(model.size, model.gender);
                
                // Active wrist size options with individual stocks
                const wristSizeOptions = [
                    { size: "15 cm (Cổ tay nhỏ)", stock: Math.floor(Math.random() * 5) + 3 },
                    { size: "16 cm (Cổ tay vừa)", stock: Math.floor(Math.random() * 7) + 4 },
                    { size: "17 cm (Cổ tay tiêu chuẩn)", stock: Math.floor(Math.random() * 10) + 5 },
                    { size: "18 cm (Cổ tay hơi lớn)", stock: Math.floor(Math.random() * 6) + 3 },
                    { size: "19 cm (Cổ tay rất lớn)", stock: Math.floor(Math.random() * 4) + 2 }
                ];

                const totalStock = wristSizeOptions.reduce((acc, opt) => acc + opt.stock, 0);

                const newProduct = {
                    name: model.name,
                    description: `Đồng hồ cao cấp ${model.name} chính hãng từ Thụy Sỹ và Nhật Bản. Trang bị vỏ làm bằng ${model.material}, mặt kính ${model.glass}, kích thước đường kính mặt số ${model.size}, chịu nước lên đến ${model.wr}. Hoạt động bền bỉ, sang trọng, mang lại đẳng cấp vượt trội cho người sử dụng.`,
                    price: model.price,
                    costPrice: costPrice,
                    originalPrice: null,
                    image: getWatchImg(index),
                    images: [getWatchImg(index + 1), getWatchImg(index + 2)],
                    categoryId: categoryId || null,
                    brand: brandId,
                    stock: totalStock,
                    colors: richColors, // 2-3 realistic color options!
                    sizes: richSizes,   // 1-2 realistic size options!
                    wristSizeOptions: wristSizeOptions, // 5 active wrist size options with stocks!
                    lowStockThreshold: 3,
                    isActive: true,
                    isFeatured: Math.random() > 0.8,
                    salesCount: Math.floor(Math.random() * 150) + 15,
                    gender: model.gender,
                    type: model.type,
                    specs: {
                        movement: {
                            type: model.type === "automatic" ? "Cơ tự động (Automatic)" : (model.type === "mechanical" ? "Cơ lên cót tay (Hand-wound)" : "Bộ máy Quartz (Pin)"),
                            caliber: "Swiss/Japan Made",
                            powerReserve: model.type === "automatic" ? "42 giờ" : (model.type === "mechanical" ? "40 giờ" : ""),
                            jewels: model.type === "automatic" ? "25 chân kính" : "",
                            frequency: model.type === "automatic" ? "28,800 vph" : ""
                        },
                        case: {
                            diameter: model.size,
                            thickness: "11.5 mm",
                            lugToLug: "48 mm",
                            material: model.material,
                            caseBack: "Nắp kín hoặc Nắp kính sapphire lộ máy",
                            crown: "Núm vặn xoắn chống nước"
                        },
                        strap: {
                            material: model.material.includes("Thép") ? "Thép không gỉ 316L" : (model.material.includes("Nhựa") ? "Nhựa Resin cao cấp" : "Dây Da cao cấp"),
                            claspType: "Khóa gập an toàn hoặc Khóa cài truyền thống",
                            color: model.color
                        },
                        waterResistance: model.wr,
                        glass: model.glass === "Sapphire" ? "Kính sapphire nguyên khối chống xước" : "Kính khoáng cường lực (Mineral Crystal)",
                        dial: {
                            color: model.color,
                            indices: "Dạ quang cao cấp"
                        },
                        warranty: "5 năm toàn cầu chính hãng"
                    }
                };

                finalProductsList.push(newProduct);
                index++;
            }
        }

        console.log(`5. Inserting ${finalProductsList.length} final products into Database...`);
        const inserted = await Product.insertMany(finalProductsList);
        console.log(`Successfully seeded ${inserted.length} real products with rich choices!`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed with error:", err);
        process.exit(1);
    }
};

seedRealProducts();
