import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		question: {
			type: String,
			required: true,
		},
		answer: {
			type: String,
			default: null,
		},
		isAnswered: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
