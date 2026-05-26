import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { chatWithAI } from '../controllers/ai.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

const testCases = [
  // Nhóm 1: 10 câu CÓ DỮ LIỆU
  "Bên mình có gì nhỉ",
  "Tầm 10 triệu đổ lại có con nào cho nữ không?",
  "Tìm đồng hồ nam dây da tầm 5 triệu.",
  "Mẫu Seiko nào hot nhất tầm giá dưới 7 triệu?",
  "Tài chính 15 triệu có mua được Longines nào không?",
  "Có mẫu đồng hồ cơ lộ máy nào tầm 10 triệu không shop?",
  "Tìm mẫu kính Sapphire chống trầy tầm 4 triệu thôi.",
  "Đồng hồ nam trung niên tầm 20 triệu làm quà tặng bố.",
  "Shop có con nào chạy pin siêu mỏng dưới 3 triệu không?",
  "Cho xem mấy mẫu dây kim loại mặt xanh dương tầm 8 triệu.",

  // Nhóm 2: 10 câu KHÔNG CÓ TRONG PROJECT
  "Có Rolex chính hãng nào giá 2 triệu không?",
  "Bên mình có bán Apple Watch Series 9 không shop?",
  "Tìm cho mình con Hublot Classic Fusion tầm 300 triệu.",
  "Shop có bán sẵn dây da cá sấu thay thế cho đồng hồ không?",
  "Hôm nay Hà Nội có mưa không em?",
  "Có mẫu đồng hồ thông minh nào đo được nhịp tim dưới 1 triệu không?",
  "Bên mình có sửa đồng hồ bị vào nước hay thay kính không?",
  "Tư vấn cho mình mấy mẫu đồng hồ treo tường phòng khách tầm 2 triệu.",
  "Cho mình xin công thức lau kính đồng hồ bị mờ tại nhà với.",
  "Shop có ship COD sang Nhật Bản hay nước ngoài không?"
];

async function runTest(message) {
  return new Promise((resolve) => {
    const req = { body: { message } };
    const res = {
      status(code) {
        return this;
      },
      json(data) {
        resolve(data);
      }
    };
    chatWithAI(req, res).catch((err) => {
      resolve({ error: err.message });
    });
  });
}

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  console.log('\n🚀 Starting Chatbot Real Scenario Evaluation...\n');

  for (let i = 0; i < testCases.length; i++) {
    const prompt = testCases[i];
    console.log(`----------------------------------------------------------------`);
    console.log(`📝 [CASE ${i + 1}] Prompt: "${prompt}"`);
    console.log(`----------------------------------------------------------------`);

    const result = await runTest(prompt);
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`🤖 AI: "${result.response}"`);
      if (result.products && result.products.length > 0) {
        console.log(`🎴 suggestedProducts (${result.products.length} cards returned):`);
        result.products.forEach((p) => {
          console.log(`   - [${p.brand}] ${p.name} | Price: ${p.price.toLocaleString('vi-VN')}đ | Stock: ${p.stock}`);
        });
      } else {
        console.log(`🎴 suggestedProducts: None (No cards)`);
      }
      console.log(`⚡ Provider: ${result.provider}`);
    }
    console.log();
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch(console.error);
