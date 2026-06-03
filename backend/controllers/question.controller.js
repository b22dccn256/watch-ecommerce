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
      question,
    });

    await newQuestion.save();

    await newQuestion.populate("user", "name");

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const listAllQuestions = async (req, res) => {
  try {
    const answered = req.query.answered;
    const filter = {};
    if (answered === "false") {
      filter.answer = { $exists: false };
    } else if (answered === "true") {
      filter.answer = { $exists: true };
    }

    const limit = parseInt(req.query.limit) || 10;
    const questions = await Question.find(filter)
      .populate("user", "name email")
      .populate("product", "name image slug slugToken")
      .sort({ createdAt: -1 })
      .limit(limit);

    const totalQuestions = await Question.countDocuments(filter);

    res.json({ questions, totalQuestions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || !String(answer).trim()) {
      return res
        .status(400)
        .json({ message: "Câu trả lời không được để trống." });
    }
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { answer: String(answer).trim(), isAnswered: true },
      { new: true },
    )
      .populate("user", "name email")
      .populate("product", "name image slug slugToken");
    if (!question)
      return res.status(404).json({ message: "Question not found" });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
