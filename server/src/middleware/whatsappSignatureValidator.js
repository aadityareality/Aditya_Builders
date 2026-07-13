import crypto from "crypto";
import whatsappConfig from "../config/whatsappConfig.js";

/**
 * Express middleware to validate X-Hub-Signature-256 header sent by Meta Webhook.
 * It computes the SHA256 HMAC of the raw request payload using the configured WhatsApp App Secret.
 */
export const validateWhatsAppSignature = (req, res, next) => {
  const signatureHeader = req.headers["x-hub-signature-256"];
  
  // Bypassed if App Secret is not configured (e.g. initial setup, sandbox testing)
  if (!whatsappConfig.appSecret) {
    console.warn("⚠️ WHATSAPP_APP_SECRET is not configured in .env. Webhook signature validation skipped.");
    return next();
  }

  if (!signatureHeader) {
    console.error("❌ Webhook validation failed: X-Hub-Signature-256 header is missing.");
    return res.status(401).json({ success: false, message: "Signature header missing" });
  }

  try {
    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") {
      console.error("❌ Webhook validation failed: Invalid signature format.");
      return res.status(400).json({ success: false, message: "Invalid signature format" });
    }

    const signatureHash = parts[1];
    
    // Ensure rawBody is available
    if (!req.rawBody) {
      console.error("❌ Webhook validation error: req.rawBody is not defined. Ensure express.json verify option is enabled.");
      return res.status(500).json({ success: false, message: "Internal server payload issue" });
    }

    const expectedHash = crypto
      .createHmac("sha256", whatsappConfig.appSecret)
      .update(req.rawBody)
      .digest("hex");

    if (signatureHash !== expectedHash) {
      console.error("❌ Webhook validation failed: HMAC signature mismatch.");
      return res.status(401).json({ success: false, message: "Signature mismatch" });
    }

    next();
  } catch (err) {
    console.error("❌ Webhook validation exception:", err.message);
    return res.status(500).json({ success: false, message: "Signature verification exception" });
  }
};

export default validateWhatsAppSignature;
