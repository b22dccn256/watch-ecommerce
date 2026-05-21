require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const hashed = await bcrypt.hash('Test@123', 10);
  await User.updateOne(
    { email: 'audit@test.com' },
    { name: 'Admin Audit', email: 'audit@test.com', password: hashed, role: 'admin', gender: 'male', emailVerified: true },
    { upsert: true }
  );
  console.log('Admin user ready: audit@test.com / Test@123');
  await mongoose.disconnect();
}

createAdmin().catch(e => { console.error(e); process.exit(1); });
