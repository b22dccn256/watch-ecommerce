import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["bot", "waiting", "active", "closed"],
      default: "bot",
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
