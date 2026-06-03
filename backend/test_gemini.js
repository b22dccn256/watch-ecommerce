import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `Bạn là nhân viên tư vấn của Luxury Watch. Dưới đây là lịch sử trò chuyện với khách hàng. 
Hãy đọc và đưa ra MỘT câu trả lời đề xuất tốt nhất, lịch sự, chuyên nghiệp để tư vấn cho khách hàng. Chỉ trả lời nội dung cần chat, không thêm giải thích.\n\n` + 
`Khách: Hi\nNhân viên: `;

async function run() {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("Success:", response);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
