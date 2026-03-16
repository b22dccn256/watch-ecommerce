const mongoose = require('mongoose');

// Mảng chứa tên ảnh trong public/ tương ứng với từ khóa tìm kiếm trong Database
const imageMappings = [
    { keyword: "F-91", image: "/CasioF-91.jpg" },
    { keyword: "GA-2100", image: "/CasioG-Shock-GA2100.jpg" },
    { keyword: "Citizen", image: "/CitizenEco-DriveAviator.jpg" },
    { keyword: "Garmin", image: "/GarminFenix-7-SapphireSolar.jpg" },
    { keyword: "Seiko", image: "/Seiko-5-Quân Đội-SNK809.jpg" }
];

async function updateImages() {
    try {
        // Kết nối đến MongoDB
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const productSchema = new mongoose.Schema({
            name: String,
            image: String
        }, { strict: false });

        const Product = mongoose.model('Product', productSchema, 'products');

        const products = await Product.find({});
        console.log(`Found ${products.length} products in DB.`);

        let updatedCount = 0;

        for (let product of products) {
            let matchedImage = null;

            // Tìm keyword phù hợp với tên sản phẩm
            for (let mapping of imageMappings) {
                if (product.name.includes(mapping.keyword)) {
                    matchedImage = mapping.image;
                    break;
                }
            }

            if (matchedImage) {
                // Cập nhật URL
                await Product.updateOne({ _id: product._id }, { $set: { image: matchedImage } });
                console.log(`Updated [${product.name}] with image: ${matchedImage}`);
                updatedCount++;
            } else {
                console.log(`Skipped [${product.name}] (No matching image).`);
            }
        }

        console.log(`Successfully updated ${updatedCount} products.`);
    } catch (error) {
        console.error("Error updating images:", error);
    } finally {
        process.exit(0);
    }
}

updateImages();
