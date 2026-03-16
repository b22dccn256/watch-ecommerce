const mongoose = require('mongoose');

async function test() {
    await mongoose.connect(MONGO_URI);

    const Product = mongoose.model('Product', new mongoose.Schema({
        category: String,
        name: String
    }), 'products');

    const products = await Product.find({}, 'category name limit');
    const categories = [...new Set(products.map(p => p.category))];

    console.log("Categories in DB:", categories);
    process.exit(0);
}

test();
