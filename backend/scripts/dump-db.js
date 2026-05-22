import mongoose from 'mongoose';
import dotenv from 'dotenv';
import util from 'util';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Aborting.');
  process.exit(1);
}

const pretty = (obj) => util.inspect(obj, { depth: 2, colors: false, compact: false });

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log(`Found ${cols.length} collections`);

    for (const c of cols) {
      try {
        const name = c.name;
        const coll = db.collection(name);
        const count = await coll.countDocuments();
        console.log('\n---');
        console.log(`Collection: ${name} — count: ${count}`);

        const sample = await coll.find({}).limit(5).toArray();
        if (sample.length === 0) {
          console.log('(no documents)');
        } else {
          console.log('Sample documents:');
          console.log(pretty(sample));
        }
      } catch (e) {
        console.error('Error reading collection', c.name, e.message);
      }
    }

    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (err) {
    console.error('DB dump failed:', err.message || err);
    process.exit(2);
  }
}

run();
