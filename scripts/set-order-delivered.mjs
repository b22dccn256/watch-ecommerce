import mongoose from "mongoose";
const uri =
  "mongodb://honghai:honghai123@ac-tjl0mqw-shard-00-00.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-01.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-02.4gjtocf.mongodb.net:27017/watchstore_db?ssl=true&replicaSet=atlas-109xk8-shard-0&authSource=admin";
const orderCode = process.argv[2] || "DHQAKX7PR1";
await mongoose.connect(uri);
const r = await mongoose.connection.db
  .collection("orders")
  .updateOne({ orderCode }, { $set: { status: "delivered" } });
console.log("Updated:", r.modifiedCount, "/", r.matchedCount);
const order = await mongoose.connection.db
  .collection("orders")
  .findOne(
    { orderCode },
    { projection: { _id: 1, status: 1, user: 1, "products.product": 1 } },
  );
console.log("Order:", JSON.stringify(order));
await mongoose.disconnect();
