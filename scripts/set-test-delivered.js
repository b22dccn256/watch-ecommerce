const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb://honghai:honghai123@ac-tjl0mqw-shard-00-00.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-01.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-02.4gjtocf.mongodb.net:27017/watchstore_db?ssl=true&replicaSet=atlas-109xk8-shard-0&authSource=admin"
  )
  .then(async () => {
    const db = mongoose.connection.db;
    const r = await db.collection("orders").updateOne(
      { orderCode: "DHXWFFZ9GY" },
      { $set: { status: "delivered" } }
    );
    console.log("Updated:", r.modifiedCount, r.matchedCount);
    const order = await db
      .collection("orders")
      .findOne(
        { orderCode: "DHXWFFZ9GY" },
        { projection: { _id: 1, status: 1, "products.product": 1, user: 1 } }
      );
    console.log("Order:", JSON.stringify(order));
    mongoose.disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
