import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: 0,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      // Keep for backward compatibility or creator tracking
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    usageHistory: [
      {
        usedAt: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

couponSchema
  .virtual("discountPercentage")
  .get(function () {
    return this.discountValue;
  })
  .set(function (value) {
    this.discountValue = value;
  });

couponSchema
  .virtual("discountAmount")
  .get(function () {
    return this.discountValue;
  })
  .set(function (value) {
    this.discountValue = value;
  });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
