import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
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
			required: function() {
				// Password is only required if the user doesn't have an OAuth ID
				return !this.googleId && !this.facebookId && !this.githubId;
			},
			minlength: [6, "Password must be at least 6 characters long"],
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
				wristSize: {
					type: Number,
					default: null, // e.g., 160 mm
				},
			},
		],
		wishlist: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		phone: {
			type: String,
			default: "",
			index: true,
			sparse: true, // Cho phép nhiều user chưa có SĐT (empty string / null)
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
	},
	{
		timestamps: true,
	}
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
		const salt = await bcrypt.genSalt(10);
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
	if (!this.emailVerificationExpires || this.emailVerificationExpires < new Date()) return false;
	return true;
};

const User = mongoose.model("User", userSchema);

export default User;
