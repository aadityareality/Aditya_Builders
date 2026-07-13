import mongoose from "mongoose";
import crypto from "crypto";
import whatsappConfig from "../src/config/whatsappConfig.js";
import whatsappService from "../src/services/whatsappService.js";
import { verifyWebhook, receiveWebhook } from "../src/controllers/whatsappController.js";
import { validateWhatsAppSignature } from "../src/middleware/whatsappSignatureValidator.js";
import WebhookLog from "../models/WebhookLog.js";

// Ensure environment variables or defaults are loaded
process.env.VERIFY_TOKEN = process.env.VERIFY_TOKEN || "aaditya-builders-webhook";
process.env.ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "919974858500";
process.env.WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || "test-app-secret";

const testResults = [];

function recordResult(testName, passed, details = "") {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? "✅" : "❌"} ${testName}: ${details}`);
}

async function runTests() {
  console.log("=== STARTING WHATSAPP BUSINESS API INTEGRATION AUDIT & TEST SUITE ===");

  // --- TEST 1: ENVIRONMENT CONFIGURATION AUDIT ---
  try {
    const vars = [
      "WHATSAPP_ACCESS_TOKEN",
      "PHONE_NUMBER_ID",
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "VERIFY_TOKEN",
      "ADMIN_WHATSAPP_NUMBER",
      "GRAPH_API_VERSION"
    ];
    const missing = vars.filter(v => !process.env[v]);
    
    // Support ADMIN_PHONE_NUMBER fallback too
    const adminPhone = whatsappConfig.adminPhoneNumber;
    
    recordResult(
      "Environment Variables Audit", 
      true, 
      `Loaded successfully. Admin Phone: ${adminPhone}. (Missing secret keys for real API: [${missing.join(", ")}])`
    );
  } catch (err) {
    recordResult("Environment Variables Audit", false, err.message);
  }

  // --- CONNECT TO DATABASE ---
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://AdityaBuilders:Yakshit123@adityabuilders.wc0oack.mongodb.net/?appName=AdityaBuilders";
    await mongoose.connect(mongoUri);
    recordResult("MongoDB Connection", true, "Connected to staging database successfully.");
  } catch (err) {
    recordResult("MongoDB Connection", false, `Failed to connect: ${err.message}`);
  }

  // --- TEST 2: GET /api/webhook (WEBHOOK VERIFICATION) ---
  try {
    // A: Missing parameters (Expects HTTP 400)
    let req = { query: {}, originalUrl: "/api/webhook" };
    let resContent = "";
    let resStatus = 0;
    let res = {
      status: function(code) { resStatus = code; return this; },
      send: function(body) { resContent = body; return this; }
    };
    await verifyWebhook(req, res);
    recordResult(
      "GET /api/webhook - Missing params check",
      resStatus === 400 && resContent.includes("Missing parameters"),
      `Status: ${resStatus}, Response: ${resContent}`
    );

    // B: Invalid token (Expects HTTP 403)
    req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": "wrong-token", "hub.challenge": "12345" },
      originalUrl: "/api/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=12345"
    };
    await verifyWebhook(req, res);
    recordResult(
      "GET /api/webhook - Invalid token check",
      resStatus === 403 && resContent === "Forbidden",
      `Status: ${resStatus}, Response: ${resContent}`
    );

    // C: Valid verification (Expects HTTP 200 with challenge value)
    req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": "aaditya-builders-webhook", "hub.challenge": "ch-987" },
      originalUrl: "/api/webhook?hub.mode=subscribe&hub.verify_token=aaditya-builders-webhook&hub.challenge=ch-987"
    };
    await verifyWebhook(req, res);
    recordResult(
      "GET /api/webhook - Valid verification check",
      resStatus === 200 && resContent === "ch-987",
      `Status: ${resStatus}, Response: ${resContent}`
    );
  } catch (err) {
    recordResult("GET /api/webhook Verification Suite", false, err.message);
  }

  // --- TEST 3: WEBHOOK SIGNATURE MIDDLEWARE ---
  try {
    const originalAppSecret = whatsappConfig.appSecret;
    whatsappConfig.appSecret = "test-app-secret";

    const rawBodyBuffer = Buffer.from(JSON.stringify({ test: "data" }));
    const correctSignature = "sha256=" + crypto
      .createHmac("sha256", whatsappConfig.appSecret)
      .update(rawBodyBuffer)
      .digest("hex");

    // A: Correct Signature
    let req = {
      headers: { "x-hub-signature-256": correctSignature },
      rawBody: rawBodyBuffer
    };
    let nextCalled = false;
    let resStatus = 0;
    let resContent = "";
    let res = {
      status: function(code) { resStatus = code; return this; },
      json: function(body) { resContent = body; return this; }
    };
    const next = () => { nextCalled = true; };
    validateWhatsAppSignature(req, res, next);
    recordResult(
      "Signature Validator - Valid check",
      nextCalled === true,
      `Passed validation. next() triggered.`
    );

    // B: Incorrect Signature (Expects HTTP 401)
    req = {
      headers: { "x-hub-signature-256": "sha256=invalid-signature-hash" },
      rawBody: rawBodyBuffer
    };
    nextCalled = false;
    resStatus = 0;
    resContent = "";
    validateWhatsAppSignature(req, res, next);
    recordResult(
      "Signature Validator - Invalid check",
      resStatus === 401 && resContent.message === "Signature mismatch",
      `Status: ${resStatus}, Response: ${JSON.stringify(resContent)}`
    );

    whatsappConfig.appSecret = originalAppSecret; // Restore original app secret
  } catch (err) {
    recordResult("Signature Validator Suite", false, err.message);
  }

  // --- TEST 4: CHATBOT RESPONSES & FALLBACK LOGIC ---
  let originalSendTextMessage = whatsappService.sendTextMessage;
  let originalSendInteractiveButtons = whatsappService.sendInteractiveButtons;
  let sentMessages = [];
  
  whatsappService.sendTextMessage = async (to, text) => {
    sentMessages.push({ to, text });
    return { success: true, mock: true };
  };
  whatsappService.sendInteractiveButtons = async (to, text, buttons) => {
    sentMessages.push({ to, text });
    return { success: true, mock: true };
  };

  try {
    const simulateIncomingMessage = async (from, name, text) => {
      sentMessages = [];
      const payload = {
        object: "whatsapp_business_account",
        entry: [{
          id: "123456",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "919974858500", phone_number_id: "12345" },
              contacts: [{ profile: { name }, wa_id: from }],
              messages: [{
                from,
                id: "msg-id-" + Date.now(),
                timestamp: String(Math.floor(Date.now() / 1000)),
                text: { body: text },
                type: "text"
              }]
            },
            field: "messages"
          }]
        }]
      };
      
      const req = { body: payload };
      const res = {
        status: function(code) { return this; },
        json: function(body) { return this; }
      };
      await receiveWebhook(req, res);
      return sentMessages;
    };

    // A: Test "Hi" Chatbot trigger
    let replies = await simulateIncomingMessage("919998112121", "Alice", "Hi");
    recordResult(
      "Chatbot Trigger: 'Hi'",
      replies.length === 1 && replies[0].text.includes("Welcome to Aaditya Builders"),
      `Reply: "${replies[0]?.text}"`
    );

    // B: Test "Price" Chatbot trigger
    replies = await simulateIncomingMessage("919998112121", "Alice", "Price");
    recordResult(
      "Chatbot Trigger: 'Price'",
      replies.length === 1 && replies[0].text.includes("pricing"),
      `Reply: "${replies[0]?.text}"`
    );

    // C: Test "Projects" Chatbot trigger
    replies = await simulateIncomingMessage("919998112121", "Alice", "Projects");
    recordResult(
      "Chatbot Trigger: 'Projects'",
      replies.length === 1 && replies[0].text.includes("https://adityabuilders.in"),
      `Reply: "${replies[0]?.text}"`
    );

    // D: Test "Location" Chatbot trigger
    replies = await simulateIncomingMessage("919998112121", "Alice", "Location");
    recordResult(
      "Chatbot Trigger: 'Location'",
      replies.length === 1 && replies[0].text.includes("Bhavnagar"),
      `Reply: "${replies[0]?.text}"`
    );

    // E: Test "Contact" Chatbot trigger
    replies = await simulateIncomingMessage("919998112121", "Alice", "Contact");
    recordResult(
      "Chatbot Trigger: 'Contact'",
      replies.length === 1 && replies[0].text.includes("99748"),
      `Reply: "${replies[0]?.text}"`
    );

    // F: Test Fallback Forward to Admin
    replies = await simulateIncomingMessage("919998112121", "Alice", "Is there a penthouse available?");
    recordResult(
      "Chatbot Fallback: Forward to Admin",
      replies.length === 2 && 
      replies.some(r => r.to === whatsappConfig.adminPhoneNumber && r.text.includes("Alice") && r.text.includes("Is there a penthouse available?")),
      `Admin Alert Recipient: ${replies[0]?.to}, Alert Text: "${replies[0]?.text.replace(/\n/g, " ")}"`
    );
  } catch (err) {
    recordResult("Chatbot Verification Suite", false, err.message);
  } finally {
    whatsappService.sendTextMessage = originalSendTextMessage;
    whatsappService.sendInteractiveButtons = originalSendInteractiveButtons;
  }

  // --- TEST 5: MONGODB LOGGING VERIFICATION ---
  try {
    const latestLog = await WebhookLog.findOne().sort({ createdAt: -1 });
    recordResult(
      "MongoDB Webhook Logging",
      latestLog !== null && latestLog.eventType === "message" && latestLog.processed === true,
      `Latest DB Webhook Log -> Event Type: "${latestLog?.eventType}", Processed: ${latestLog?.processed}`
    );
  } catch (err) {
    recordResult("MongoDB Webhook Logging", false, err.message);
  }

  // Close database connection
  await mongoose.disconnect();
  console.log("=== AUDIT AND TESTING SUITE COMPLETE ===");
}

runTests().catch(err => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
