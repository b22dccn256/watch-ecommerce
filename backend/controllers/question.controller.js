import Question from "../models/question.model.js";

export const getProductQuestions = async (req, res) => {
	try {
		const { productId } = req.params;
		const questions = await Question.find({ product: productId })
			.populate("user", "name")
			.sort({ createdAt: -1 });
		res.json(questions);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createQuestion = async (req, res) => {
	try {
		const { productId } = req.params;
		const { question } = req.body;
		const userId = req.user._id;

		if (!question) {
			return res.status(400).json({ message: "Câu hỏi không được để trống." });
		}

		const newQuestion = new Question({
			product: productId,
			user: userId,
			question
		});

		await newQuestion.save();
		
		await newQuestion.populate("user", "name");
		
		res.status(201).json(newQuestion);
	} catch (error) {
		console.error("Error creating question:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
