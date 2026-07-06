import express from "express";
import rateLimit from "express-rate-limit";
import { createCallbackRequest } from "../controllers/publicCallbackController.js";

const router = express.Router();

// Stricter rate limiter — max 5 callback requests per 15 minutes per IP
const callbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many callback requests from this IP. Please try again after 15 minutes.",
  },
});

router.post("/", callbackLimiter, createCallbackRequest);

export default router;
