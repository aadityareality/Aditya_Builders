import express from "express";
import {
  verifyWebhook,
  receiveWebhook,
  sendCustomText,
  sendCustomTemplate,
  testWhatsApp,
  testBrochure,
  testLocation,
  testAppointment,
  testReminder,
  getWhatsAppStats,
  testChat,
  testSocket,
  testMedia,
  testReply,
  getDiagnostics,
  runSelfTest,
} from "../controllers/whatsappController.js";
import { validateWhatsAppSignature } from "../middleware/whatsappSignatureValidator.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Meta Webhook verification route (GET)
 */
router.get("/api/webhook", verifyWebhook);
router.get("/webhook", verifyWebhook); // Fail-safe fallback

/**
 * Meta Webhook receiving route (POST)
 * Wrapped in signature validation middleware to ensure security in production.
 */
router.post("/api/webhook", validateWhatsAppSignature, receiveWebhook);
router.post("/webhook", validateWhatsAppSignature, receiveWebhook); // Fail-safe fallback

/**
 * Custom text dispatch route (POST)
 */
router.post("/api/whatsapp/send", protect, sendCustomText);

/**
 * Custom template dispatch route (POST)
 */
router.post("/api/whatsapp/template", protect, sendCustomTemplate);

/**
 * Instant testing dispatch route (POST)
 */
router.post("/api/whatsapp/test", protect, testWhatsApp);

/**
 * Diagnostic test route for brochure PDFs (POST)
 */
router.post("/api/test-brochure", protect, testBrochure);

/**
 * Diagnostic test route for location pins (POST)
 */
router.post("/api/test-location", protect, testLocation);

/**
 * Diagnostic test route for site visit appointments (POST)
 */
router.post("/api/test-appointment", protect, testAppointment);

/**
 * Diagnostic test route for triggering reminders manually (POST)
 */
router.post("/api/test-reminder", protect, testReminder);

/**
 * WhatsApp Stats for Admin Settings UI (GET)
 */
router.get("/api/admin/whatsapp/stats", protect, getWhatsAppStats);

/**
 * CRM Test Routes (Feature 25 — admin-auth protected)
 */
router.post("/api/test-chat", protect, testChat);
router.post("/api/test-socket", protect, testSocket);
router.post("/api/test-media", protect, testMedia);
router.post("/api/test-reply", protect, testReply);

/**
 * Diagnostic and Self-Test Routes (Phases 13 & 14)
 */
router.get("/api/admin/whatsapp/diagnostics", protect, getDiagnostics);
router.post("/api/admin/whatsapp/self-test", protect, runSelfTest);

export default router;
