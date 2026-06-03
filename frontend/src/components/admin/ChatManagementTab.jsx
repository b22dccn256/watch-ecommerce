import { useState, useEffect, useRef } from "react";
import axios from "../../lib/axios";
import { io } from "socket.io-client";
import { Send, Bot, User, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const ChatManagementTab = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedRoomRef = useRef(selectedRoom);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    // Fetch initial rooms
    const fetchRooms = async () => {
      try {
        const res = await axios.get("/chat/rooms");
        setRooms(res.data);
      } catch (err) {
        console.error("Error fetching rooms", err);
      }
    };
    fetchRooms();

    // Initialize socket
    const socketUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
    socketRef.current = io(socketUrl, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("admin_join");
    });

    socketRef.current.on("room_updated", (updatedRoom) => {
      setRooms((prev) => {
        const index = prev.findIndex((r) => r.sessionToken === updatedRoom.sessionToken);
        if (index > -1) {
          const newRooms = [...prev];
          newRooms[index] = updatedRoom;
          // Sort by lastMessageAt descending
          return newRooms.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        } else {
          return [updatedRoom, ...prev];
        }
      });
      
      if (selectedRoomRef.current?.sessionToken === updatedRoom.sessionToken) {
        setSelectedRoom(updatedRoom);
      }
    });

    socketRef.current.on("admin_receive_message", ({ sessionToken, message }) => {
      if (selectedRoomRef.current && selectedRoomRef.current.sessionToken === sessionToken) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Auto mark as read if we are looking at it
        socketRef.current.emit("mark_read", { sessionToken, role: "admin" });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`/chat/rooms/${selectedRoom.sessionToken}/messages`);
          setMessages(res.data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          
          // Mark as read
          socketRef.current.emit("mark_read", { sessionToken: selectedRoom.sessionToken, role: "admin" });
        } catch (err) {
          console.error("Error fetching messages", err);
        }
      };
      fetchMessages();
    }
  }, [selectedRoom?.sessionToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !selectedRoom) return;

    const messageData = {
      sessionToken: selectedRoom.sessionToken,
      sender: "admin",
      content: input.trim()
    };

    socketRef.current.emit("send_message", messageData);
    setInput("");
  };

  const handleAiSuggest = async () => {
    if (!messages.length) {
      toast.error("Cần có lịch sử chat để gợi ý");
      return;
    }
    
    setIsSuggesting(true);
    try {
      const res = await axios.post("/chat/ai-suggest", {
        history: messages.slice(-10).map(m => ({ sender: m.sender, content: m.content }))
      });
      setInput(res.data.suggestion);
      toast.success("AI đã gợi ý câu trả lời!");
    } catch (err) {
      toast.error("Lỗi AI gợi ý");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDeleteRoom = async (sessionToken, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện của khách vãng lai này?")) return;
    try {
      await axios.delete(`/chat/rooms/${sessionToken}`);
      setRooms(prev => prev.filter(r => r.sessionToken !== sessionToken));
      if (selectedRoom?.sessionToken === sessionToken) {
        setSelectedRoom(null);
      }
      toast.success("Đã xóa phòng chat");
    } catch (err) {
      console.error("Lỗi khi xóa phòng chat:", err);
      toast.error("Không thể xóa phòng chat");
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-surface shadow-sm">
      {/* Sidebar: Danh sách chat */}
      <div className="w-1/3 border-r border-black/10 dark:border-white/10 flex flex-col bg-surface-soft">
        <div className="p-4 border-b border-black/10 dark:border-white/10 bg-surface">
          <h2 className="font-bold text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-[color:var(--color-gold)]" /> Danh sách khách hàng
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-secondary text-sm">Chưa có cuộc trò chuyện nào</div>
          ) : (
            rooms.map((room) => (
              <div
                key={room._id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition ${
                  selectedRoom?.sessionToken === room.sessionToken
                    ? "bg-[color:var(--color-gold)]/10"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-primary text-sm flex items-center gap-1.5">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm">
                        {room.user ? room.user.name : `${room.sessionToken.slice(0, 8)}...`}
                      </span>
                      {room.user && (
                        <span className="text-[10px] text-secondary font-normal leading-none">{room.user.email}</span>
                      )}
                      {!room.user && (
                        <span className="text-[10px] text-secondary font-normal leading-none italic">Khách vãng lai</span>
                      )}
                    </div>
                    {room.status === "waiting" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">Chờ NV</span>
                    )}
                    {room.status === "active" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">Đang chat</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {room.unreadCountAdmin > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                        {room.unreadCountAdmin}
                      </div>
                    )}
                    {!room.user && (
                      <button 
                        onClick={(e) => handleDeleteRoom(room.sessionToken, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-secondary truncate max-w-full">
                  {room.lastMessage || "Chưa có tin nhắn"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-black/10 dark:border-white/10 bg-surface flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  Phiên chat: {selectedRoom.user ? selectedRoom.user.name : `${selectedRoom.sessionToken.slice(0, 8)}...`}
                </h3>
                {selectedRoom.user ? (
                  <span className="text-xs text-secondary">{selectedRoom.user.email}</span>
                ) : (
                  <span className="text-xs text-secondary italic">Khách vãng lai</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-secondary">
                    Ủy quyền AI:
                  </span>
                  <button
                    onClick={() => {
                      if (!selectedRoom.user) return;
                      socketRef.current.emit("toggle_bot", { sessionToken: selectedRoom.sessionToken, enableBot: selectedRoom.status !== "bot" });
                    }}
                    disabled={!selectedRoom.user}
                    title={!selectedRoom.user ? "Khách vãng lai bắt buộc sử dụng AI" : "Bật/tắt AI"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      !selectedRoom.user || selectedRoom.status === "bot" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                    } ${!selectedRoom.user ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !selectedRoom.user || selectedRoom.status === "bot" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`flex ${
                    msg.sender === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender === "admin"
                        ? "bg-[#b7925a] text-white shadow-sm"
                        : msg.sender === "bot"
                        ? "bg-black/5 dark:bg-white/5 text-primary border border-black/10 dark:border-white/10"
                        : "bg-surface-soft text-primary border border-black/10 dark:border-white/10"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <div className="text-[10px] font-bold text-secondary mb-1 flex items-center gap-1">
                        <Bot className="h-3 w-3" /> AI Bot
                      </div>
                    )}
                    {msg.sender === "admin" && (
                      <div className="text-[10px] font-bold text-white/90 mb-1 flex items-center justify-end gap-1">
                        Quản trị viên <ShieldCheck className="h-3 w-3" />
                      </div>
                    )}
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.sender === "admin" ? "text-right" : ""}`}>{msg.content}</p>
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 text-xs opacity-75 italic">
                        (Đã gửi kèm {msg.products.length} sản phẩm)
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface border-t border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiSuggest}
                  disabled={isSuggesting || !selectedRoom.user || selectedRoom.status === "bot"}
                  className="flex items-center justify-center p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="AI Gợi ý trả lời"
                >
                  <Sparkles className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!selectedRoom.user || selectedRoom.status === "bot"}
                    placeholder={!selectedRoom.user ? "Khách cần đăng nhập để chat với nhân viên..." : selectedRoom.status === "bot" ? "Tắt Ủy quyền AI để có thể nhắn tin..." : "Nhập tin nhắn hỗ trợ..."}
                    className="w-full bg-surface border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-[color:var(--color-gold)] resize-none disabled:bg-black/5 disabled:dark:bg-white/5 disabled:cursor-not-allowed"
                    rows={1}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || !selectedRoom.user || selectedRoom.status === "bot"}
                  className="p-3 rounded-xl bg-[color:var(--color-gold)] text-black hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary">
            <Bot className="w-16 h-16 mb-4 opacity-20" />
            <p>Chọn một khách hàng để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManagementTab;
