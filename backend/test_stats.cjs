const mongoose = require('mongoose');

mongoose.connect('mongodb://honghai:honghai123@ac-tjl0mqw-shard-00-00.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-01.4gjtocf.mongodb.net:27017,ac-tjl0mqw-shard-00-02.4gjtocf.mongodb.net:27017/watchstore_db?ssl=true&replicaSet=atlas-109xk8-shard-0&authSource=admin').then(async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for(const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(c.name, count);
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});
