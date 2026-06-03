import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      validate: {
        validator: (value) => /^[\p{L}\s]{2,50}$/u.test(value.trim()),
        message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Password is only required if the user doesn't have an OAuth ID
        return !this.googleId && !this.facebookId && !this.githubId;
      },
      minlength: [8, "Password must be at least 8 characters long"],
    },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String, default: "" },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        selectedColor: {
          type: String,
          default: null,
        },
        selectedSize: {
          type: String,
          default: null,
        },
        wristSize: {
          type: String,
          default: null,
        },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },
    phone: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },
    address: {
      type: String,
      default: "",
    },
    addressBook: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          fullName: { type: String, default: "" },
          phone: { type: String, default: "" },
          address: { type: String, required: true },
          city: { type: String, required: true },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    defaultAddressId: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    birthday: {
      type: Date,
      default: null,
    },
    cartUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    lastVerificationEmailSent: {
      type: Date,
      default: null,
    },
    welcomeEmailSentAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    lastPasswordResetEmailSent: {
      type: Date,
      default: null,
    },
    // D2: Admin notes & tags
    adminNotes: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      enum: {
        values: ["VIP", "Wholesale", "Problematic", "New", "Loyal"],
        message: "Tag không hợp lệ",
      },
    },
    // Admin dashboard fields
    segment: {
      type: String,
      enum: ["VIP", "Potential", "NEW", "Regular", "At Risk"],
      default: "NEW",
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Pre-save hook để hash password trước khi lưu, và reset trạng thái verify nếu email thay đổi
userSchema.pre("save", async function () {
  if (this.isModified("email") && !this.isNew) {
    // đổi email cần verify lại
    this.emailVerified = false;
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Sinh token email verification, lưu token vào user, và set TTL 15 phút
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  this.lastVerificationEmailSent = new Date();
  return token;
};

// Kiểm tra token email verify hợp lệ, not expired
userSchema.methods.verifyEmailToken = function (token) {
  if (!token || !this.emailVerificationToken) return false;
  if (token !== this.emailVerificationToken) return false;
  if (
    !this.emailVerificationExpires ||
    this.emailVerificationExpires < new Date()
  )
    return false;
  return true;
};

const User = mongoose.model("User", userSchema);

export default User;
