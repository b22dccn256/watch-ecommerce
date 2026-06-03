import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  await connectDB();

  // Find users matching test criteria:
  // - email ending with @testmail.com or containing testmail
  // - email containing @test.local
  // - name starting with E2E
  const query = {
    $or: [
      { email: { $regex: /testmail\.com/i } },
      { email: { $regex: /@test\.local/i } },
      { email: { $regex: /^e2e\.user/i } },
      { name: { $regex: /^E2E/i } },
    ],
  };

  // Find them first to display
  const testUsers = await User.find(query)
    .select("name email role createdAt")
    .lean();
  console.log(`📋 Found ${testUsers.length} test users to clean up:\n`);
  if (testUsers.length > 0) {
    console.table(testUsers);
    const res = await User.deleteMany(query).exec();
    console.log(`\n🗑️  Deleted ${res.deletedCount} test users from database.`);
  } else {
    console.log("✨ No test users found in database.");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error during user cleanup:", err);
  process.exit(1);
});
