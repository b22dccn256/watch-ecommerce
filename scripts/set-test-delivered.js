require("dotenv").config({ path: __dirname + "/../backend/.env" });
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI)
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
