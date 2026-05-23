require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }));

  const rows = await Product.aggregate([
    { $match: { deletedAt: null, brand: { $ne: null } } },
    { $group: { _id: '$brand', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const brands = await Brand.find({ _id: { $in: rows.map((r) => r._id) } }).select('name slug').lean();
  const map = new Map(brands.map((b) => [String(b._id), b]));

  console.log(JSON.stringify(rows.slice(0, 20).map((r) => ({
    brand: map.get(String(r._id))?.name || String(r._id),
    count: r.count,
  })), null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
