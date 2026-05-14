import express from "express";
import { protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { createQuestion, getProductQuestions, listAllQuestions } from "../controllers/question.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductQuestions);
router.post("/product/:productId", protectRoute, createQuestion);
router.get("/", protectRoute, managementRoute, listAllQuestions);

export default router;
