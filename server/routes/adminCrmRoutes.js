import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import {
  getConversations,
  getChatMessages,
  sendCrmReply,
  updateCustomer,
  addCustomerNote,
  updateCustomerTags,
  updateChatStatus,
  deleteChatThread,
  exportChatHistory,
  getCrmAnalytics,
} from "../controllers/adminCrmController.js";

const router = express.Router();

// Reply rate limiter — max 30 messages per minute per admin
const replyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many messages. Please slow down." },
  keyGenerator: (req) => `crm_reply_${req.admin?._id || req.ip}`,
});

// All CRM routes require admin auth
router.use(protect);

// ── Conversation Routes ───────────────────────────────────────────────────────
router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getChatMessages);
router.post("/conversations/:id/reply", replyLimiter, sendCrmReply);
router.patch("/conversations/:id/status", updateChatStatus);
router.delete("/conversations/:id", deleteChatThread);
router.get("/conversations/:id/export", exportChatHistory);

// ── Customer Routes ───────────────────────────────────────────────────────────
router.patch("/customers/:id", updateCustomer);
router.post("/customers/:id/notes", addCustomerNote);
router.put("/customers/:id/tags", updateCustomerTags);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", getCrmAnalytics);

export default router;
