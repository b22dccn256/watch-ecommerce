import { ChatRoom } from "../models/chatRoom.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { callAI } from "./ai.controller.js";

export const getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find().sort({ lastMessageAt: -1 }).populate("user", "name email");
    res.json(rooms);
  } catch (error) {
    console.error("Error in getRooms:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { sessionToken } = req.params;
    const room = await ChatRoom.findOne({ sessionToken });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const messages = await ChatMessage.find({ roomId: room._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error in getRoomMessages:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const aiSuggest = async (req, res) => {
  try {
    const { history } = req.body;
    
    const systemPrompt = `Bạn là nhân viên tư vấn của Luxury Watch. Dưới đây là lịch sử trò chuyện với khách hàng. 
    Hãy đọc và đưa ra MỘT câu trả lời đề xuất tốt nhất, lịch sự, chuyên nghiệp để tư vấn cho khách hàng. Chỉ trả lời nội dung cần chat, không thêm giải thích.`;
    
    const userMessage = history.map(m => `${m.sender === 'user' ? 'Khách' : 'Nhân viên'}: ${m.content}`).join('\n') + `\nNhân viên: `;

    const response = await callAI(systemPrompt, userMessage);
    
    if (!response) {
      throw new Error("AI returned null");
    }

    res.json({ suggestion: response });
  } catch (error) {
    console.error("Error in aiSuggest:", error);
    res.status(500).json({ message: "Lỗi AI" });
  }
};
