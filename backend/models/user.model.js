import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Tên là bắt buộc"],
			trim: true,
			minlength: [2, "Tên phải có ít nhất 2 ký tự"],
			maxlength: [50, "Tên không được vượt quá 50 ký tự"],
		},
		email: {
			type: String,
			required: [true, "Email là bắt buộc"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Mật khẩu là bắt buộc"],
			minlength: [8, "Mật khẩu phải có ít nhất 8 ký tự"],
		},
		phone: {
			type: String,
			default: "",
			sparse: true, // allow empty string / null, only enforce unique on real values
		},
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
					default: null,
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
			enum: ["customer", "admin", "staff"],
			default: "customer",
		},
		twoFactorEnabled: {
			type: Boolean,
			default: true,
		},
		cartUpdatedAt: {
			type: Date,
			default: Date.now,
		},
		// Email verification fields
		isEmailVerified: {
			type: Boolean,
			default: true, // true for existing users — only new signups start as false
		},
		emailVerificationToken: {
			type: String,
			default: null,
		},
		emailVerificationExpires: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function () {
	if (!this.isModified("password")) return;

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
