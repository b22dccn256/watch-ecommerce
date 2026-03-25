import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createQuestion, getProductQuestions } from "../controllers/question.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductQuestions);
router.post("/product/:productId", protectRoute, createQuestion);

export default router;
