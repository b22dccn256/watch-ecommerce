import { Server } from "socket.io";
import { ChatRoom } from "./models/chatRoom.model.js";
import { ChatMessage } from "./models/chatMessage.model.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "https://timematrix.io.vn",
        "https://www.timematrix.io.vn",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // Guest/Customer joins their specific room
    socket.on("join_room", async ({ sessionToken, userId }) => {
      if (!sessionToken) return;
      socket.join(sessionToken);
      
      let room = await ChatRoom.findOne({ sessionToken });
      if (!room) {
        room = new ChatRoom({ sessionToken, user: userId || null });
        await room.save();
      } else if (userId && !room.user) {
        room.user = userId;
        await room.save();
      }
      
      // Send previous messages
      const messages = await ChatMessage.find({ roomId: room._id }).sort({ createdAt: 1 });
      socket.emit("chat_history", messages);
      socket.emit("room_status_changed", room.status);
    });

    // Admin joins the admin room to listen to all chats
    socket.on("admin_join", () => {
      socket.join("admin_room");
    });

    // Handle new message
    socket.on("send_message", async ({ sessionToken, sender, content, products, actions }) => {
      let room = await ChatRoom.findOne({ sessionToken });
      if (!room) return;

      // Prevent admin from replying to guests
      if (sender === "admin" && !room.user) {
        return;
      }

      const message = new ChatMessage({
        roomId: room._id,
        sender,
        content,
        products: products || [],
        actions: actions || []
      });
      await message.save();

      // Update room last message info
      room.lastMessage = content;
      room.lastMessageAt = new Date();
      
      if (sender === "user") {
        room.unreadCountAdmin += 1;
      } else {
        room.unreadCountUser += 1;
        // If admin replies, status is active
        if (sender === "admin") {
          room.status = "active";
          io.to(sessionToken).emit("room_status_changed", room.status);
        }
      }
      await room.save();
      await room.populate("user", "name email");

      // Emit to the specific customer room
      io.to(sessionToken).emit("receive_message", message);
      
      // Emit to all admins
      io.to("admin_room").emit("admin_receive_message", { sessionToken, message });
      io.to("admin_room").emit("room_updated", room);
    });

    // Mark messages as read
    socket.on("mark_read", async ({ sessionToken, role }) => {
      let room = await ChatRoom.findOne({ sessionToken });
      if (!room) return;
      
      if (role === "admin") {
        room.unreadCountAdmin = 0;
      } else if (role === "user") {
        room.unreadCountUser = 0;
      }
      await room.save();
      await room.populate("user", "name email");
      io.to("admin_room").emit("room_updated", room);
    });

    // Request human support
    socket.on("request_human", async ({ sessionToken }) => {
      let room = await ChatRoom.findOne({ sessionToken });
      if (!room || !room.user) return; // Prevent guests from requesting human
      room.status = "waiting";
      await room.save();
      await room.populate("user", "name email");
      io.to("admin_room").emit("room_updated", room);
      io.to(sessionToken).emit("room_status_changed", room.status);
    });

    // Toggle Bot status by Admin
    socket.on("toggle_bot", async ({ sessionToken, enableBot }) => {
      let room = await ChatRoom.findOne({ sessionToken });
      if (!room || !room.user) return; // Prevent toggling for guests
      room.status = enableBot ? "bot" : "active";
      await room.save();
      await room.populate("user", "name email");
      io.to("admin_room").emit("room_updated", room);
      io.to(sessionToken).emit("room_status_changed", room.status);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
