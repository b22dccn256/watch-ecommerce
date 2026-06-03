import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "admin", "bot"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    products: [
      {
        id: String,
        name: String,
        brand: String,
        price: Number,
        image: String,
        slug: String,
        slugToken: String,
      },
    ],
    actions: [
      {
        label: String,
        to: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
