import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const oldEmail = 'admin@test.local';
  const newEmail = 'admin@test.local.com';
  const user = await User.findOne({ email: oldEmail });
  if (!user) {
    console.log('No admin found with email', oldEmail);
    await mongoose.disconnect();
    return;
  }
  user.email = newEmail;
  await user.save();
  console.log('Updated admin email to', newEmail);
  await mongoose.disconnect();
};

run().catch(err => { console.error(err); process.exit(1); });
