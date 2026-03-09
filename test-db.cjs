const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb+srv://danganh05122003:6p816oR1cTzO6nK9@mern-ecomere.4gjtocf.mongodb.net/ecommerce?retryWrites=true&w=majority');

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
