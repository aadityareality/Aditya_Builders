import express from "express";
import {
  verifyWebhook,
  receiveWebhook,
  sendCustomText,
  sendCustomTemplate,
  testWhatsApp,
} from "../controllers/whatsappController.js";
import { validateWhatsAppSignature } from "../middleware/whatsappSignatureValidator.js";

const router = express.Router();

/**
 * Meta Webhook verification route (GET)
 */
router.get("/api/webhook", verifyWebhook);

/**
 * Meta Webhook receiving route (POST)
 * Wrapped in signature validation middleware to ensure security in production.
 */
router.post("/api/webhook", validateWhatsAppSignature, receiveWebhook);

/**
 * Custom text dispatch route (POST)
 */
router.post("/api/whatsapp/send", sendCustomText);

/**
 * Custom template dispatch route (POST)
 */
router.post("/api/whatsapp/template", sendCustomTemplate);

/**
 * Instant testing dispatch route (POST)
 */
router.post("/api/whatsapp/test", testWhatsApp);

export default router;
