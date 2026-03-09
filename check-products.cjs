const mongoose = require('mongoose');

async function checkProducts() {
    await mongoose.connect('mongodb+srv://dev_hai:b22dccn268@cluster0.4gjtocf.mongodb.net/watchstore_db');

    const Product = mongoose.model('Product', new mongoose.Schema({
        name: String,
        image: String
    }), 'products');

    const products = await Product.find({}, 'name image');
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
}

checkProducts();
