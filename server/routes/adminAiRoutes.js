import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSmartReply,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getAiDashboardStats
} from "../controllers/adminAiController.js";

const router = express.Router();

// Protect all admin AI routes
router.use(protect);

router.get("/smart-reply", getSmartReply);
router.get("/faqs", getFaqs);
router.post("/faqs", createFaq);
router.put("/faqs/:id", updateFaq);
router.delete("/faqs/:id", deleteFaq);
router.get("/dashboard-stats", getAiDashboardStats);

export default router;
