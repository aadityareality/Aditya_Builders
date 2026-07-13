import WebhookLog from "../../models/WebhookLog.js";
import whatsappConfig from "../config/whatsappConfig.js";
import whatsappService from "../services/whatsappService.js";

/**
 * GET /api/webhook
 * Verification endpoint for Meta Webhook
 */
export const verifyWebhook = async (req, res) => {
  try {
    console.log("[WhatsApp Webhook GET] req.originalUrl:", req.originalUrl);

    // Parse parameters directly from req.originalUrl to bypass express-mongo-sanitize stripping keys with dots
    const urlObj = new URL(req.originalUrl, "http://localhost");
    const mode = urlObj.searchParams.get("hub.mode");
    const token = urlObj.searchParams.get("hub.verify_token");
    const challenge = urlObj.searchParams.get("hub.challenge");

    console.log(`[WhatsApp Webhook GET] Parsed values -> mode: ${mode}, token: ${token}, challenge: ${challenge}`);

    // Check if parameters are missing
    if (!mode || !token || !challenge) {
      console.warn("[WhatsApp Controller] Webhook verification failed. Missing parameters.");
      return res.status(400).send("Missing parameters");
    }

    // Compare token with process.env.VERIFY_TOKEN
    const expectedToken = process.env.VERIFY_TOKEN || "aaditya-builders-webhook";

    if (mode === "subscribe" && token === expectedToken) {
      console.log("[WhatsApp Controller] Webhook verification successful.");
      return res.status(200).send(challenge);
    } else {
      console.warn("[WhatsApp Controller] Webhook verification failed. Token mismatch.");
      return res.status(403).send("Forbidden");
    }
  } catch (error) {
    console.error("[WhatsApp Controller] Verification error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * POST /api/webhook
 * Receives incoming messages, delivery statuses, and other events from Meta
 */
export const receiveWebhook = async (req, res) => {
  // Always return 200 OK instantly to Meta to prevent timeout/retries
  res.status(200).json({ success: true });

  let logDoc = null;
  try {
    const payload = req.body;
    
    // Determine event type
    let eventType = "other";
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.messages) {
      eventType = "message";
    } else if (value?.statuses) {
      eventType = "status";
    }

    // Persist raw webhook payload log
    logDoc = await WebhookLog.create({
      eventType,
      payload,
      processed: false,
    });

    // Check if it's a message event
    if (eventType === "message") {
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      const from = message.from; // Customer phone
      const customerName = contact?.profile?.name || "Customer";

      if (message.type === "text") {
        const textBody = message.text?.body?.trim();
        const lowerText = textBody.toLowerCase();

        console.log(`[WhatsApp Controller] Incoming text message from ${from} (${customerName}): "${textBody}"`);

        // Chatbot Auto-Response Matrix
        if (lowerText === "hi" || lowerText === "hello" || lowerText === "hey") {
          await whatsappService.sendTextMessage(
            from, 
            "Welcome to Aaditya Group of Companies.\n\nHow may we help you?"
          );
        } else if (lowerText === "price") {
          await whatsappService.sendTextMessage(
            from, 
            "Our sales team will contact you shortly with pricing."
          );
        } else if (lowerText === "projects") {
          await whatsappService.sendTextMessage(
            from, 
            "Please visit\n\nhttps://adityabuilders.in"
          );
        } else if (lowerText === "location") {
          await whatsappService.sendTextMessage(
            from, 
            "Shop No.10\n\nAaditya Elegance\n\nJewell Circle to RTO Road\n\nBhavnagar"
          );
        } else if (lowerText === "contact") {
          await whatsappService.sendTextMessage(
            from, 
            "📞 +91 9974858500"
          );
        } else {
          // Default / Fallback: Forward user message to admin
          console.log(`[WhatsApp Controller] Forwarding query to admin from ${from}`);
          const adminAlert = 
            `🚨 *New Customer Message Alert*\n\n` +
            `👤 *Name:* ${customerName}\n` +
            `📞 *Phone:* ${from}\n` +
            `💬 *Message:* ${textBody}\n` +
            `🕒 *Time:* ${new Date().toLocaleString()}`;
          
          await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlert);
        }
      } else {
        // Handle media / other message types by alerting admin
        console.log(`[WhatsApp Controller] Forwarding media/non-text alert to admin from ${from}`);
        const adminAlert = 
          `🚨 *New Media Message Alert*\n\n` +
          `👤 *Name:* ${customerName}\n` +
          `📞 *Phone:* ${from}\n` +
          `📁 *Message Type:* ${message.type}\n` +
          `🕒 *Time:* ${new Date().toLocaleString()}\n\nPlease check Meta Business Manager for details.`;
        
        await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlert);
      }
    } else if (eventType === "status") {
      // Process delivery status reports (sent, delivered, read)
      const statusObj = value.statuses[0];
      console.log(`[WhatsApp Controller] Status Update: Msg ${statusObj.id} is now ${statusObj.status} for ${statusObj.recipient_id}`);
    } else {
      console.log("[WhatsApp Controller] Received non-messages/non-statuses changes event:", JSON.stringify(payload));
    }

    // Mark as processed successfully
    if (logDoc) {
      logDoc.processed = true;
      await logDoc.save();
    }
  } catch (error) {
    console.error("❌ [WhatsApp Controller] Webhook Processing Failed:", error.message);
    if (logDoc) {
      logDoc.error = error.message;
      logDoc.processed = false;
      try {
        await logDoc.save();
      } catch (saveErr) {
        console.error("❌ Failed to update error log in database:", saveErr.message);
      }
    }
  }
};

/**
 * POST /api/whatsapp/send
 * Sends custom WhatsApp text message (Admin endpoint)
 */
export const sendCustomText = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: "Missing phone or message in body" });
    }

    const response = await whatsappService.sendTextMessage(phone, message);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("[WhatsApp Controller] Send error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/whatsapp/template
 * Sends custom template message (Admin endpoint)
 */
export const sendCustomTemplate = async (req, res) => {
  try {
    const { phone, template, language, components } = req.body;

    if (!phone || !template) {
      return res.status(400).json({ success: false, message: "Missing phone or template in body" });
    }

    const response = await whatsappService.sendTemplateMessage(
      phone,
      template,
      language || "en_US",
      components || []
    );
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("[WhatsApp Controller] Template send error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/whatsapp/test
 * Immediate test endpoint
 */
export const testWhatsApp = async (req, res) => {
  try {
    const { phone, message } = req.body;
    const targetPhone = phone || whatsappConfig.adminPhoneNumber;
    const textMsg = message || "Hello from Aaditya Group of Companies";

    console.log(`[WhatsApp Controller] Triggering test message to ${targetPhone}`);
    const response = await whatsappService.sendTextMessage(targetPhone, textMsg);
    
    return res.status(200).json({
      success: true,
      message: "Test WhatsApp sent successfully",
      recipient: targetPhone,
      data: response
    });
  } catch (error) {
    console.error("[WhatsApp Controller] Test endpoint failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Test send failed",
      error: error.message
    });
  }
};

export default {
  verifyWebhook,
  receiveWebhook,
  sendCustomText,
  sendCustomTemplate,
  testWhatsApp
};
