import express from "express";
import {
  protectRoute,
  managementRoute,
} from "../middleware/auth.middleware.js";
import {
  createQuestion,
  getProductQuestions,
  listAllQuestions,
  answerQuestion,
} from "../controllers/question.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductQuestions);
router.post("/product/:productId", protectRoute, createQuestion);
router.get("/", protectRoute, managementRoute, listAllQuestions);
router.patch("/:id/answer", protectRoute, managementRoute, answerQuestion);

export default router;
