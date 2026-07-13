import WebhookLog from "../../models/WebhookLog.js";
import ContactInquiry from "../../models/ContactInquiry.js";
import Appointment from "../../models/Appointment.js";
import BrochureDownload from "../../models/BrochureDownload.js";
import ConversationState from "../../models/ConversationState.js";
import Project from "../../models/Project.js";
import SiteSettings from "../../models/SiteSettings.js";
import ReminderLog from "../../models/ReminderLog.js";
import whatsappConfig from "../config/whatsappConfig.js";
import whatsappService from "../services/whatsappService.js";
import Customer from "../../models/Customer.js";
import Chat from "../../models/Chat.js";
import Message from "../../models/Message.js";
import MessageStatus from "../../models/MessageStatus.js";
import { emitToAdmins, getIO } from "../services/socketService.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

/**
 * Downloads a media file from Meta's temporary URL and re-uploads to Cloudinary.
 * Meta media URLs expire — this persists them permanently.
 */
const persistMetaMedia = async (mediaId, mimeType) => {
  try {
    if (!whatsappConfig.accessToken) return null;

    // Step 1: Get the media URL from Meta
    const mediaInfoRes = await axios.get(
      `https://graph.facebook.com/v23.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${whatsappConfig.accessToken}` } }
    );
    const mediaUrl = mediaInfoRes.data?.url;
    if (!mediaUrl) return null;

    // Step 2: Download the actual binary
    const mediaRes = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${whatsappConfig.accessToken}` },
      responseType: "arraybuffer"
    });

    // Step 3: Upload to Cloudinary as base64
    const base64 = Buffer.from(mediaRes.data).toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;
    const resourceType = mimeType.startsWith("image") ? "image" : mimeType.startsWith("video") ? "video" : "raw";

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "whatsapp_media",
      resource_type: resourceType,
    });

    return uploadResult.secure_url;
  } catch (err) {
    console.error("⚠️ [CRM] Media persist to Cloudinary failed:", err.message);
    return null;
  }
};

/**
 * Upserts a Customer + Chat document, then logs an incoming Message to CRM.
 * Emits Socket.IO event to connected admins.
 */
const logIncomingToCRM = async (messageObj, customerName, from, cloudinaryUrl = null) => {
  try {
    // Deduplicate by Meta message ID
    const metaMessageId = messageObj.id;
    const existing = await Message.findOne({ metaMessageId });
    if (existing) return; // Already logged — skip duplicate

    // 1. Upsert Customer
    let customer = await Customer.findOneAndUpdate(
      { phone: from },
      {
        $set: { name: customerName, lastActiveAt: new Date() },
        $setOnInsert: { leadStatus: "Warm" }
      },
      { upsert: true, new: true }
    );

    // 2. Upsert Chat thread
    let chat = await Chat.findOneAndUpdate(
      { customer: customer._id },
      { $set: { status: "Open" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. Build message body
    let msgBody;
    let msgType = messageObj.type;

    if (msgType === "text") {
      msgBody = messageObj.text?.body || "";
    } else if (["image", "video", "audio", "document", "sticker"].includes(msgType)) {
      const mediaData = messageObj[msgType];
      msgBody = {
        mediaId: mediaData?.id,
        mimeType: mediaData?.mime_type,
        fileName: mediaData?.filename,
        sha256: mediaData?.sha256,
        caption: mediaData?.caption || "",
        cloudinaryUrl: cloudinaryUrl || null,
        mediaError: cloudinaryUrl === null ? "Media upload to Cloudinary failed or not attempted" : null
      };
    } else if (msgType === "location") {
      msgBody = {
        latitude: messageObj.location?.latitude,
        longitude: messageObj.location?.longitude,
        name: messageObj.location?.name,
        address: messageObj.location?.address
      };
    } else if (msgType === "contacts") {
      msgBody = messageObj.contacts;
      msgType = "contact";
    } else if (msgType === "interactive") {
      msgBody = messageObj.interactive;
    } else {
      msgBody = { raw: messageObj };
    }

    // 4. Save Message document
    const msgDoc = await Message.create({
      chat: chat._id,
      direction: "incoming",
      messageType: msgType,
      body: msgBody,
      metaMessageId,
      deliveryStatus: "delivered",
      timestamp: new Date(parseInt(messageObj.timestamp) * 1000 || Date.now()),
      sentBy: null
    });

    // 5. Update Customer preview fields
    const preview = msgType === "text" ? msgBody : `[${msgType}]`;
    await Customer.findByIdAndUpdate(customer._id, {
      lastMessage: String(preview).substring(0, 120),
      lastMessageAt: new Date(),
      lastActiveAt: new Date(),
      $inc: { unreadCount: 1 }
    });

    // 6. Populate and emit via Socket.IO to all admins
    const populated = await Message.findById(msgDoc._id).populate("sentBy", "name");
    emitToAdmins("message_new", {
      chatId: chat._id,
      customerId: customer._id,
      message: populated,
      customer: await Customer.findById(customer._id)
        .populate("interestedProject", "title")
        .populate("assignedExecutive", "name email")
    }, customer.assignedExecutive);

  } catch (err) {
    console.error("❌ [CRM] logIncomingToCRM Error:", err.message);
  }
};

// Helper to parse date strings in format DD/MM/YYYY
const parseDateStr = (str) => {
  const match = str.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  const year = parseInt(match[3], 10);
  const parsed = new Date(year, month, day);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

// ── In-Memory Spam Protection Sliding Window (Part 9) ───────────────────────
const spamCounter = {};

const isSpamming = (phone) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  if (!spamCounter[phone]) {
    spamCounter[phone] = [];
  }
  
  // Filter old messages
  spamCounter[phone] = spamCounter[phone].filter(ts => ts > oneMinuteAgo);
  
  if (spamCounter[phone].length >= 10) {
    return true;
  }
  
  spamCounter[phone].push(now);
  return false;
};

// ── Conversation State & History Helper (Part 1 & 3) ─────────────────────────
const updateConversationState = async (phone, flow, step, data, currentState = null) => {
  const prevFlow = currentState ? currentState.currentFlow : null;
  const prevStep = currentState ? currentState.currentStep : 0;
  const prevData = currentState ? currentState.collectedData : {};

  await ConversationState.findOneAndUpdate(
    { phone },
    {
      $set: {
        currentFlow: flow,
        currentStep: step,
        collectedData: data,
        previousFlow: prevFlow,
        previousStep: prevStep,
        previousData: prevData,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
};

// ── Typing Indicator Delay and Read Receipts Wrappers (Part 5 & 6) ───────────
const sendBotReply = async (to, messageId, text) => {
  try {
    if (messageId) {
      await whatsappService.markMessageAsRead(messageId).catch(err =>
        console.error("⚠️ Failed to mark message as read:", err.message)
      );
    }
    // Deliberate ~1 second typing animation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await whatsappService.sendTextMessage(to, text);
    console.log(`\x1b[32m[Chatbot Reply Sent]\x1b[0m -> Recipient: ${to}, Msg: "${text.substring(0, 60).replace(/\n/g, ' ')}..."`);
    return res;
  } catch (err) {
    console.error("❌ sendBotReply Error:", err.message);
  }
};

const sendBotInteractiveButtons = async (to, messageId, text, buttons) => {
  try {
    if (messageId) {
      await whatsappService.markMessageAsRead(messageId).catch(() => {});
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await whatsappService.sendInteractiveButtons(to, text, buttons);
    console.log(`\x1b[32m[Chatbot Reply Sent (Buttons)]\x1b[0m -> Recipient: ${to}`);
    return res;
  } catch (err) {
    console.error("❌ sendBotInteractiveButtons Error:", err.message);
    return sendBotReply(to, messageId, text);
  }
};

const sendBotLocation = async (to, messageId, lat, lng, name, address) => {
  try {
    if (messageId) {
      await whatsappService.markMessageAsRead(messageId).catch(() => {});
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await whatsappService.sendLocation(to, lat, lng, name, address);
    console.log(`\x1b[32m[Chatbot Reply Sent (Location)]\x1b[0m -> Recipient: ${to}`);
    return res;
  } catch (err) {
    console.error("❌ sendBotLocation Error:", err.message);
  }
};

const sendBotDocument = async (to, messageId, url, fileName, caption) => {
  try {
    if (messageId) {
      await whatsappService.markMessageAsRead(messageId).catch(() => {});
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await whatsappService.sendDocument(to, url, fileName, caption);
    console.log(`\x1b[32m[Chatbot Reply Sent (Document)]\x1b[0m -> Recipient: ${to}`);
    return res;
  } catch (err) {
    console.error("❌ sendBotDocument Error:", err.message);
  }
};

// ── Welcome Menu & Office Location Handlers ──────────────────────────────────
const sendWelcomeMenu = async (to, messageId = null) => {
  const text = 
    `🏡 *Welcome to Aaditya Builders*\n\n` +
    `How may we help you today?\n\n` +
    `Reply with the option number:\n` +
    `1️⃣ New Projects\n` +
    `2️⃣ Ready Possession\n` +
    `3️⃣ Book Site Visit\n` +
    `4️⃣ Download Brochure\n` +
    `5️⃣ Contact Sales\n` +
    `6️⃣ Office Location\n` +
    `7️⃣ Contact Number`;

  const buttons = [
    { id: "menu_projects", title: "New Projects" },
    { id: "menu_visit", title: "Book Site Visit" },
    { id: "menu_location", title: "Office Location" }
  ];

  await sendBotInteractiveButtons(to, messageId, text, buttons);
};

const sendOfficeLocation = async (to, messageId = null) => {
  try {
    const settings = await SiteSettings.getSettings();
    const lat = settings.mapLatitude || 21.7484;
    const lng = settings.mapLongitude || 72.1328;
    const name = settings.companyName || "Aditya Builders";
    const address = settings.address || "Shivomnagar, RTO Road, Bhavnagar";

    // Step A: Send location pin message
    await sendBotLocation(to, messageId, lat, lng, name, address);

    // Step B: Send follow-up detailed message card
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const followUpText = 
      `📍 *${name}*\n` +
      `${address}\n\n` +
      `Google Maps: ${googleMapsLink}\n\n` +
      `🕒 *Office Hours:* ${settings.officeHours || "Mon-Sat: 9:30 AM - 7:00 PM"}\n` +
      `📞 *Phone:* ${settings.phoneNumbers?.[0] || "+91 99748 58500"}\n` +
      `📧 *Email:* ${settings.email || "aadityareality1@gmail.com"}`;

    await sendBotReply(to, null, followUpText);
  } catch (err) {
    console.error("❌ Failed to send office location details:", err.message);
  }
};

// ── Back Navigation State Swapping Handler ───────────────────────────────────
const handleBackNavigation = async (phone, state, messageId) => {
  if (!state || (!state.previousFlow && state.previousStep === 0)) {
    await sendWelcomeMenu(phone, messageId);
    return;
  }

  const targetFlow = state.previousFlow;
  const targetStep = state.previousStep;
  const targetData = state.previousData;

  // Restore previous state context
  await ConversationState.findOneAndUpdate(
    { phone },
    {
      $set: {
        currentFlow: targetFlow,
        currentStep: targetStep,
        collectedData: targetData,
        previousFlow: null,
        previousStep: 0,
        previousData: {},
        updatedAt: new Date()
      }
    }
  );

  console.log(`\x1b[35m[Chatbot] Back Navigation executed for ${phone}. Restoring state: ${targetFlow} (Step: ${targetStep})\x1b[0m`);

  // Prompt the corresponding state question again
  if (!targetFlow) {
    await sendWelcomeMenu(phone, messageId);
  } else if (targetFlow === "site_visit_booking") {
    if (targetStep === 1) {
      await sendBotReply(phone, messageId, "Great! Let's book a site visit.\n\nFirst, please provide your **Full Name**:");
    } else if (targetStep === 2) {
      await sendBotReply(phone, messageId, `Your number is currently detected as ${phone}. Reply with *YES* to use it, or type your preferred 10-digit phone number:`);
    } else if (targetStep === 3) {
      const projects = await Project.find({ isActive: true }).sort({ displayOrder: 1 });
      const listText = projects.map((p, idx) => `${idx + 1}. ${p.title} (${p.location})`).join("\n");
      await sendBotReply(phone, messageId, `Please choose the project you want to visit (reply with the option number):\n\n${listText}`);
    } else if (targetStep === 4) {
      await sendBotReply(phone, messageId, "Please enter your preferred **Date** for the visit (Format: DD/MM/YYYY):");
    } else if (targetStep === 5) {
      await sendBotReply(phone, messageId, "Please enter your preferred **Time** (e.g. 10:30 AM or 4:00 PM):");
    } else if (targetStep === 6) {
      await sendBotReply(phone, messageId, "How many **Visitors** will attend? (Please enter a number, e.g. 2):");
    } else if (targetStep === 7) {
      await sendBotReply(phone, messageId, "Any **Special Notes** or requests? (Reply with *SKIP* or *NONE* if none):");
    }
  } else if (targetFlow === "brochure_request") {
    if (targetStep === 1) {
      const projects = await Project.find({ isActive: true }).sort({ displayOrder: 1 });
      const listText = projects.map((p, idx) => `${idx + 1}. ${p.title}`).join("\n");
      await sendBotReply(phone, messageId, `Which project would you like the brochure for? (Reply with the option number):\n\n${listText}`);
    }
  } else if (targetFlow === "reschedule") {
    if (targetStep === 1) {
      await sendBotReply(phone, messageId, "Please provide your preferred **New Date** (Format: DD/MM/YYYY):");
    }
  }
};

/**
 * GET /api/webhook
 * Verification endpoint for Meta Webhook
 */
export const verifyWebhook = async (req, res) => {
  try {
    console.log("[WhatsApp Webhook GET] req.originalUrl:", req.originalUrl);

    // Parse from req.query first, fallback to manual parsing of originalUrl
    const mode = req.query["hub.mode"] || new URL(req.originalUrl, "http://localhost").searchParams.get("hub.mode");
    const token = req.query["hub.verify_token"] || new URL(req.originalUrl, "http://localhost").searchParams.get("hub.verify_token");
    const challenge = req.query["hub.challenge"] || new URL(req.originalUrl, "http://localhost").searchParams.get("hub.challenge");

    console.log(`[WhatsApp Webhook GET] Parsed values -> mode: ${mode}, token: ${token}, challenge: ${challenge}`);

    if (!mode || !token || !challenge) {
      console.warn("[WhatsApp Controller] Webhook verification failed. Missing parameters.");
      return res.status(400).send("Missing parameters");
    }

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

  const payload = req.body;
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  // Determine event type
  let eventType = "other";
  if (value?.messages) {
    eventType = "message";
  } else if (value?.statuses) {
    eventType = "status";
  }

  // ── ANSI Colored Debug Logging (Part 7) ────────────────────────────────────
  console.log("\x1b[36m============= WEBHOOK RECEIVED =============\x1b[0m");
  console.log(`Timestamp : ${new Date().toISOString()}`);
  console.log("Event Type:", eventType === "message" ? `\x1b[32mmessage\x1b[0m` : `\x1b[33m${eventType}\x1b[0m`);
  
  if (eventType === "message") {
    const msg = value?.messages?.[0];
    console.log(`Sender    : \x1b[35m${value?.contacts?.[0]?.profile?.name || "Customer"}\x1b[0m (\x1b[36m${msg?.from}\x1b[0m)`);
    console.log(`Msg Type  : \x1b[33m${msg?.type}\x1b[0m`);
    
    if (msg?.type === "text") {
      console.log(`Body      : "\x1b[32m${msg.text?.body}\x1b[0m"`);
    } else if (msg?.type === "interactive") {
      console.log(`Interactive:`, JSON.stringify(msg.interactive, null, 2));
    }
  } else if (eventType === "status") {
    const statusObj = value?.statuses?.[0];
    console.log(`Status Msg: ${statusObj?.id}`);
    console.log(`Status Val: \x1b[32m${statusObj?.status}\x1b[0m`);
  }
  console.log("\x1b[36m============================================\x1b[0m");

  // ── Duplicate Webhook Protection (Part 10) ─────────────────────────────────
  if (eventType === "message") {
    const msg = value?.messages?.[0];
    if (msg && msg.id) {
      const duplicateLog = await WebhookLog.findOne({
        "payload.entry.changes.value.messages.id": msg.id
      });
      if (duplicateLog) {
        console.log(`\x1b[33m[Chatbot] Duplicate webhook detected for message ID: ${msg.id}. Ignoring.\x1b[0m`);
        return;
      }
    }
  }

  let logDoc = null;
  try {
    // Persist raw webhook payload log
    logDoc = await WebhookLog.create({
      eventType,
      payload,
      processed: false,
    });

    if (eventType === "message") {
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      const from = message.from; // Customer phone
      const customerName = contact?.profile?.name || "Customer";

      // ── Spam Protection (Part 9) ───────────────────────────────────────────
      if (isSpamming(from)) {
        console.warn(`\x1b[31m[Spam Protection] Triggered for user: ${from}\x1b[0m`);
        await sendBotReply(from, message.id, "Too many messages. Please wait a minute.");
        if (logDoc) {
          logDoc.processed = true;
          await logDoc.save();
        }
        return;
      }

      // ── CRM: Persist incoming message ─────────────────────────────────────
      let cloudinaryUrl = null;
      if (["image", "video", "audio", "document", "sticker"].includes(message.type)) {
        const mediaObj = message[message.type];
        if (mediaObj?.id) {
          cloudinaryUrl = await persistMetaMedia(mediaObj.id, mediaObj.mime_type || "application/octet-stream");
        }
      }
      // Log to CRM (non-blocking)
      logIncomingToCRM(message, customerName, from, cloudinaryUrl).catch(e =>
        console.error("❌ [CRM] Background log error:", e.message)
      );
      // ─────────────────────────────────────────────────────────────────────

      let textBody = "";
      if (message.type === "text") {
        textBody = message.text?.body?.trim();
      } else if (message.type === "interactive") {
        if (message.interactive?.button_reply) {
          const buttonId = message.interactive.button_reply.id;
          if (buttonId === "menu_projects") textBody = "1";
          if (buttonId === "menu_visit") textBody = "3";
          if (buttonId === "menu_location") textBody = "6";
        } else if (message.interactive?.list_reply) {
          const listId = message.interactive.list_reply.id || "";
          const listTitle = message.interactive.list_reply.title || "";
          
          if (listId.includes("menu_projects") || listTitle.toLowerCase().includes("projects")) textBody = "1";
          else if (listId.includes("menu_visit") || listTitle.toLowerCase().includes("visit")) textBody = "3";
          else if (listId.includes("menu_location") || listTitle.toLowerCase().includes("location")) textBody = "6";
          else {
            const numericMatch = listId.match(/\d+/) || listTitle.match(/\d+/);
            textBody = numericMatch ? numericMatch[0] : (listId || listTitle);
          }
        }
      }

      if (textBody) {
        // Look up conversation state
        let state = await ConversationState.findOne({ phone: from });
        
        // ── Session Timeout Handling (Part 11) ─────────────────────────────────
        if (state && (Date.now() - new Date(state.updatedAt).getTime() > 30 * 60 * 1000)) {
          console.log(`\x1b[33m[Chatbot] Session timeout detected for ${from}. Resetting state.\x1b[0m`);
          await ConversationState.deleteOne({ phone: from });
          state = null;
        }

        console.log(`\x1b[33m[Chatbot] Incoming trigger:\x1b[0m "${textBody}" from \x1b[35m${from}\x1b[0m`);
        console.log(`\x1b[33m[Chatbot] Current State   :\x1b[0m ${state ? `${state.currentFlow} (Step: ${state.currentStep})` : "stateless"}`);

        const lowerText = textBody.toLowerCase();

        // ── Main Menu Command Trigger (Part 2 & 12) ───────────────────────────
        if (["menu", "home", "start", "restart", "reset", "0", "hey", "hello", "hi", "namaste", "hi aditya"].includes(lowerText)) {
          await ConversationState.deleteOne({ phone: from });
          await sendWelcomeMenu(from, message.id);
          if (logDoc) {
            logDoc.processed = true;
            await logDoc.save();
          }
          return;
        }

        // ── Back Navigation Trigger (Part 3) ──────────────────────────────────
        if (["back", "previous", "9"].includes(lowerText)) {
          await handleBackNavigation(from, state, message.id);
          if (logDoc) {
            logDoc.processed = true;
            await logDoc.save();
          }
          return;
        }

        // Global cancellation keywords
        if (state && state.currentFlow && ["cancel", "exit", "stop", "quit"].includes(lowerText)) {
          await ConversationState.deleteOne({ phone: from });
          await sendBotReply(from, message.id, "Operation cancelled. Returning to main menu...");
          await sendWelcomeMenu(from);
          if (logDoc) {
            logDoc.processed = true;
            await logDoc.save();
          }
          return;
        }

        // State router
        if (state && state.currentFlow === "site_visit_booking") {
          await handleSiteVisitBooking(from, textBody, state, customerName, message.id);
        } else if (state && state.currentFlow === "brochure_request") {
          await handleBrochureRequest(from, textBody, state, customerName, message.id);
        } else if (state && state.currentFlow === "reschedule") {
          await handleReschedule(from, textBody, state, customerName, message.id);
        } else {
          // Standard / Stateless Command router
          if (lowerText === "price" || lowerText === "pricing") {
            await sendBotReply(from, message.id, "Our sales team will contact you shortly with pricing.");
          } else if (lowerText === "projects") {
            await sendBotReply(from, message.id, "Please visit:\n\nhttps://adityabuilders.in");
          } else if (["location", "office", "map", "address", "visit office"].includes(lowerText)) {
            await sendOfficeLocation(from, message.id);
          } else if (lowerText === "contact") {
            await sendBotReply(from, message.id, "📞 *Contact Support:*\n\nPhone: +91 99748 58500");
          } else if (lowerText === "brochure") {
            await startBrochureRequestFlow(from, message.id, state);
          } else if (textBody === "1") {
            // New / Ongoing Projects
            const projects = await Project.find({ isActive: true, status: "Ongoing" }).sort({ displayOrder: 1 });
            if (projects.length === 0) {
              await sendBotReply(from, message.id, "We don't have any ongoing projects listed right now.");
            } else {
              const list = projects.map(p => `🏗 *${p.title}*\n📍 Locality: ${p.location}\n💰 Starting Price: ${p.startingPrice || "N/A"}`).join("\n\n");
              await sendBotReply(from, message.id, `🏢 *Ongoing Projects Catalog:*\n\n${list}\n\nBook a site visit or view brochures by selecting options from the menu!`);
            }
          } else if (textBody === "2") {
            // Ready Possession / Completed Projects
            const projects = await Project.find({ isActive: true, status: "Completed" }).sort({ displayOrder: 1 });
            if (projects.length === 0) {
              await sendBotReply(from, message.id, "We don't have any completed projects listed right now.");
            } else {
              const list = projects.map(p => `🏢 *${p.title}*\n📍 Locality: ${p.location}\n💰 Price: ${p.startingPrice || "N/A"}`).join("\n\n");
              await sendBotReply(from, message.id, `🏡 *Ready Possession Catalog:*\n\n${list}`);
            }
          } else if (textBody === "3") {
            await startSiteVisitBookingFlow(from, message.id, state);
          } else if (textBody === "4") {
            await startBrochureRequestFlow(from, message.id, state);
          } else if (textBody === "5") {
            const settings = await SiteSettings.getSettings();
            await sendBotReply(
              from,
              message.id,
              `📞 *Sales Contact Details:*\n\n` +
              `Phone: ${settings.phoneNumbers?.[0] || "+91 99748 58500"}\n` +
              `Email: ${settings.email || "aadityareality1@gmail.com"}\n` +
              `Office Hours: ${settings.officeHours || "Mon-Sat: 9:30 AM - 7:00 PM"}`
            );
          } else if (textBody === "6") {
            await sendOfficeLocation(from, message.id);
          } else if (textBody === "7") {
            const settings = await SiteSettings.getSettings();
            await sendBotReply(
              from,
              message.id,
              `🏢 *Aaditya Builders Support:*\n\n` +
              `Phone: ${settings.phoneNumbers?.[0] || "+91 99748 58500"}\n` +
              `Email: ${settings.email || "aadityareality1@gmail.com"}\n` +
              `Website: https://adityabuilders.in`
            );
          } else if (lowerText === "yes" || lowerText === "no") {
            const activeApt = await Appointment.findOne({ customerPhone: from, status: { $in: ["Confirmed", "Rescheduled"] } }).sort({ createdAt: -1 });
            if (activeApt && lowerText === "yes") {
              const data = {};
              await updateConversationState(from, "reschedule", 1, data, state);
              await sendBotReply(from, message.id, "Sure! Let's reschedule. Please provide your preferred **New Date** (Format: DD/MM/YYYY):");
            } else {
              await sendBotReply(from, message.id, "Thank you. Your site visit booking remains confirmed.");
            }
          } else {
            // Invalid / Fallback trigger (Part 4)
            console.log(`\x1b[33m[Chatbot] Unrecognized input:\x1b[0m "${textBody}" from ${from}`);
            const unrecognizedText = 
              `I didn't understand that.\n` +
              `Please choose one of the available options.\n\n` +
              `Reply:\n` +
              `1️⃣ New Projects\n` +
              `2️⃣ Ready Possession\n` +
              `3️⃣ Book Site Visit\n` +
              `4️⃣ Download Brochure\n` +
              `5️⃣ Contact Sales\n` +
              `6️⃣ Office Location\n` +
              `7️⃣ Contact Number`;
            await sendBotReply(from, message.id, unrecognizedText);
          }
        }
      }
    } else if (eventType === "status") {
      const statusObj = value.statuses[0];
      const messageId = statusObj.id;
      const messageStatus = statusObj.status;
      console.log(`[WhatsApp Controller] Status Update: Msg ${messageId} is now ${messageStatus}`);

      try {
        await ContactInquiry.updateOne(
          { whatsappCustomerMessageId: messageId },
          { whatsappCustomerMessageStatus: messageStatus }
        );
      } catch (dbErr) {
        console.error("❌ Failed to update ContactInquiry status:", dbErr.message);
      }

      // ── CRM: Update Message delivery status and emit real-time tick ───────
      try {
        const crmMsg = await Message.findOne({ metaMessageId: messageId });
        if (crmMsg) {
          const previousStatus = crmMsg.deliveryStatus;
          crmMsg.deliveryStatus = messageStatus;
          await crmMsg.save();

          // Log transition
          await MessageStatus.create({
            message: crmMsg._id,
            previousStatus,
            newStatus: messageStatus,
            rawMetaPayload: statusObj
          });

          // Emit Socket update
          emitToAdmins("message_status", {
            chatId: crmMsg.chat,
            messageId: crmMsg._id,
            metaMessageId: messageId,
            status: messageStatus
          });
        }
      } catch (crmErr) {
        console.error("❌ [CRM] Status update error:", crmErr.message);
      }
    }

    if (logDoc) {
      logDoc.processed = true;
      await logDoc.save();
    }
  } catch (error) {
    console.error("❌ [WhatsApp Controller] Webhook Processing Failed:", error.message);
    if (logDoc) {
      logDoc.error = error.message;
      logDoc.processed = false;
      try { await logDoc.save(); } catch (saveErr) { /* ignore */ }
    }
  }
};
const startSiteVisitBookingFlow = async (phone, messageId = null, currentState = null) => {
  await ConversationState.deleteMany({ phone }); // reset
  await updateConversationState(phone, "site_visit_booking", 1, {}, currentState);
  await sendBotReply(phone, messageId, "Great! Let's book a site visit.\n\nFirst, please provide your **Full Name**:");
};

const handleSiteVisitBooking = async (phone, textBody, state, customerName, messageId = null) => {
  const step = state.currentStep;
  const data = state.collectedData || {};

  if (step === 1) {
    data.name = textBody;
    await updateConversationState(phone, "site_visit_booking", 2, data, state);
    await sendBotReply(
      phone,
      messageId,
      `Got it, ${textBody}!\n\nYour number is currently detected as ${phone}. Would you like to use this number for contact, or specify a different number? Reply with *YES* to use it, or type your preferred 10-digit phone number:`
    );
  } else if (step === 2) {
    if (textBody.toUpperCase() === "YES") {
      data.phone = phone;
    } else {
      const cleanNum = textBody.replace(/[^0-9]/g, "");
      if (cleanNum.length >= 10) {
        data.phone = cleanNum;
      } else {
        await sendBotReply(phone, messageId, "Please provide a valid 10-digit phone number, or reply *YES* to confirm:");
        return;
      }
    }

    // List active projects
    const projects = await Project.find({ isActive: true }).sort({ displayOrder: 1 });
    if (projects.length === 0) {
      data.projectId = null;
      data.projectName = "General Site Visit";
      await updateConversationState(phone, "site_visit_booking", 4, data, state);
      await sendBotReply(phone, messageId, "No specific project catalog available right now. Let's schedule a general tour.\n\nPlease enter your preferred **Date** for the visit (Format: DD/MM/YYYY):");
    } else {
      const listText = projects.map((p, idx) => `${idx + 1}. ${p.title} (${p.location})`).join("\n");
      data.projectList = projects.map(p => p._id);
      await updateConversationState(phone, "site_visit_booking", 3, data, state);
      await sendBotReply(phone, messageId, `Please choose the project you want to visit (reply with the option number):\n\n${listText}`);
    }
  } else if (step === 3) {
    const idx = parseInt(textBody, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= data.projectList.length) {
      await sendBotReply(phone, messageId, "Invalid project choice. Please reply with a valid number from the catalog list:");
      return;
    }
    const projectId = data.projectList[idx];
    const project = await Project.findById(projectId);
    
    data.projectId = project._id;
    data.projectName = project.title;
    await updateConversationState(phone, "site_visit_booking", 4, data, state);
    await sendBotReply(phone, messageId, `Excellent. You've chosen *${project.title}*.\n\nPlease enter your preferred **Date** for the visit (Format: DD/MM/YYYY):`);
  } else if (step === 4) {
    const parsedDate = parseDateStr(textBody);
    if (!parsedDate) {
      await sendBotReply(phone, messageId, "Invalid date format. Please type the date in **DD/MM/YYYY** format (e.g. 25/12/2026):");
      return;
    }
    data.date = textBody;
    await updateConversationState(phone, "site_visit_booking", 5, data, state);
    await sendBotReply(phone, messageId, "Please enter your preferred **Time** (e.g. 10:30 AM or 4:00 PM):");
  } else if (step === 5) {
    data.time = textBody;
    await updateConversationState(phone, "site_visit_booking", 6, data, state);
    await sendBotReply(phone, messageId, "How many **Visitors** will attend? (Please enter a number, e.g. 2):");
  } else if (step === 6) {
    const visitors = parseInt(textBody, 10);
    if (isNaN(visitors) || visitors <= 0) {
      await sendBotReply(phone, messageId, "Please enter a valid positive number for the visitor count:");
      return;
    }
    data.visitors = visitors;
    await updateConversationState(phone, "site_visit_booking", 7, data, state);
    await sendBotReply(phone, messageId, "Any **Special Notes** or requests? (Reply with *SKIP* or *NONE* if none):");
  } else if (step === 7) {
    const notes = ["SKIP", "NONE"].includes(textBody.toUpperCase()) ? "" : textBody;
    const dateObj = parseDateStr(data.date);

    // Save appointment immediately
    const apt = await Appointment.create({
      customerName: data.name,
      customerPhone: data.phone,
      project: data.projectId || null,
      projectName: data.projectName,
      preferredDate: dateObj,
      preferredTime: data.time,
      numberOfVisitors: data.visitors,
      notes: notes,
      status: "Confirmed"
    });

    // Send customer confirmation
    const customerConfirmText = 
      `Hello ${data.name}\n` +
      `Your Site Visit is Confirmed.\n` +
      `Project: ${data.projectName}\n` +
      `Date: ${data.date}\n` +
      `Time: ${data.time}\n` +
      `Reference: ${apt.referenceId}\n` +
      `Thank you.`;

    await sendBotReply(phone, messageId, customerConfirmText);

    // Send admin notification
    const adminAlertText = 
      `📅 *NEW SITE VISIT*\n\n` +
      `Name: ${data.name}\n` +
      `Phone: ${data.phone}\n` +
      `Project: ${data.projectName}\n` +
      `Date: ${data.date}\n` +
      `Time: ${data.time}\n` +
      `Visitors: ${data.visitors}\n` +
      `Notes: ${notes || "None"}\n` +
      `Reference ID: ${apt.referenceId}`;

    await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlertText);

    // Clear state
    await ConversationState.deleteOne({ phone });
    console.log(`[Chatbot] Stateful visit booked successfully. Reference: ${apt.referenceId}`);
  }
};

const startBrochureRequestFlow = async (phone, messageId = null, currentState = null) => {
  const projects = await Project.find({ isActive: true }).sort({ displayOrder: 1 });
  if (projects.length === 0) {
    await sendBotReply(phone, messageId, "No projects are currently listed in our catalog.");
    return;
  }

  const listText = projects.map((p, idx) => `${idx + 1}. ${p.title}`).join("\n");
  const data = { projectList: projects.map(p => p._id) };
  await updateConversationState(phone, "brochure_request", 1, data, currentState);

  await sendBotReply(phone, messageId, `Which project would you like the brochure for? (Reply with the option number):\n\n${listText}`);
};

const handleBrochureRequest = async (phone, textBody, state, customerName, messageId = null) => {
  const data = state.collectedData || {};
  const idx = parseInt(textBody, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= data.projectList.length) {
    await sendBotReply(phone, messageId, "Invalid project choice. Please reply with a valid number from the catalog list:");
    return;
  }

  const projectId = data.projectList[idx];
  const project = await Project.findById(projectId);

  if (project.brochure && project.brochure.url) {
    try {
      const fileName = `${project.title.replace(/\s+/g, "_")}_Brochure.pdf`;
      await sendBotDocument(phone, messageId, project.brochure.url, fileName, `Brochure for ${project.title}`);
      
      // Log download success
      await BrochureDownload.create({
        customerPhone: phone,
        projectId: project._id,
        projectName: project.title,
        status: "sent"
      });

      // Increment project downloads
      project.downloadCount = (project.downloadCount || 0) + 1;
      await project.save();
    } catch (err) {
      console.error("❌ Failed to send brochure document:", err.message);
      await BrochureDownload.create({
        customerPhone: phone,
        projectId: project._id,
        projectName: project.title,
        status: "failed"
      });
      await sendBotReply(phone, messageId, "Sorry, we encountered a delivery issue. Please try downloading again later.");
    }
  } else {
    // Fallback if missing
    await sendBotReply(phone, messageId, `Brochure for this project isn't available yet. Would you like to speak with our sales team instead?`);
    
    // Log failure
    await BrochureDownload.create({
      customerPhone: phone,
      projectId: project._id,
      projectName: project.title,
      status: "failed"
    });

    // Notify admin
    const adminText = 
      `⚠️ *BROCHURE UNAVAILABLE ALERT*\n\n` +
      `Customer *${customerName}* (${phone}) requested a brochure for project *${project.title}*, but no brochure file is uploaded in the settings area.`;
    await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminText);
  }

  // Clear state
  await ConversationState.deleteOne({ phone });
};

const handleReschedule = async (phone, textBody, state, customerName, messageId = null) => {
  const step = state.currentStep;
  const data = state.collectedData || {};

  if (step === 1) {
    const parsedDate = parseDateStr(textBody);
    if (!parsedDate) {
      await sendBotReply(phone, messageId, "Invalid date format. Please reply with the date in **DD/MM/YYYY** format (e.g. 25/12/2026):");
      return;
    }
    data.newDate = textBody;
    await updateConversationState(phone, "reschedule", 2, data, state);
    await sendBotReply(phone, messageId, "Please enter your preferred **New Time** (e.g. 10:30 AM or 4:00 PM):");
  } else if (step === 2) {
    // Find latest confirmed/rescheduled appointment
    const apt = await Appointment.findOne({
      customerPhone: phone,
      status: { $in: ["Confirmed", "Rescheduled"] }
    }).sort({ createdAt: -1 });

    if (!apt) {
      await sendBotReply(phone, messageId, "We couldn't locate an active visit booking for this number. Rescheduling flow aborted.");
    } else {
      const dateObj = parseDateStr(data.newDate);
      apt.preferredDate = dateObj;
      apt.preferredTime = textBody;
      apt.status = "Rescheduled";
      apt.remindersSent = { h24: false, h3: false, h1: false, m30: false }; // reset reminders
      await apt.save();

      // Confirm to customer
      const confirmText = 
        `Hello ${apt.customerName}\n` +
        `Your Site Visit is Confirmed (Rescheduled).\n` +
        `Project: ${apt.projectName}\n` +
        `Date: ${data.newDate}\n` +
        `Time: ${textBody}\n` +
        `Reference: ${apt.referenceId}\n` +
        `Thank you.`;
      await sendBotReply(phone, messageId, confirmText);

      // Alert admin
      const adminAlertText = 
        `📅 *SITE VISIT RESCHEDULED*\n\n` +
        `Name: ${apt.customerName}\n` +
        `Phone: ${apt.customerPhone}\n` +
        `Project: ${apt.projectName}\n` +
        `New Date: ${data.newDate}\n` +
        `New Time: ${textBody}\n` +
        `Reference ID: ${apt.referenceId}`;
      await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlertText);
    }

    // Clear state
    await ConversationState.deleteOne({ phone });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN DIAGNOSTIC TEST ENDPOINTS (PROTECTED)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * POST /api/test-brochure
 * Sends project brochure PDF to a given number
 */
export const testBrochure = async (req, res) => {
  try {
    const { phone, projectId } = req.body;
    if (!phone || !projectId) {
      return res.status(400).json({ success: false, message: "Missing phone or projectId in body" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (!project.brochure?.url) {
      return res.status(400).json({ success: false, message: "No brochure PDF uploaded for this project yet" });
    }

    const fileName = `${project.title.replace(/\s+/g, "_")}_Brochure.pdf`;
    const response = await whatsappService.sendDocument(phone, project.brochure.url, fileName, `Brochure for ${project.title}`);

    await BrochureDownload.create({
      customerPhone: phone,
      projectId: project._id,
      projectName: project.title,
      status: "sent"
    });

    project.downloadCount = (project.downloadCount || 0) + 1;
    await project.save();

    return res.status(200).json({ success: true, message: "Brochure document dispatched successfully", data: response });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/test-location
 * Sends the location card to a given number
 */
export const testLocation = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Missing phone in body" });
    }

    await sendOfficeLocation(phone);
    return res.status(200).json({ success: true, message: "Location pin card sequence dispatched successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/test-appointment
 * Creates a test appointment directly
 */
export const testAppointment = async (req, res) => {
  try {
    const { name, phone, projectId, date, time, visitors, notes } = req.body;
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ success: false, message: "Missing name, phone, date, or time in body" });
    }

    const parsedDate = parseDateStr(date) || new Date(date);
    let projectName = "General Visit";
    if (projectId) {
      const proj = await Project.findById(projectId);
      if (proj) projectName = proj.title;
    }

    const apt = await Appointment.create({
      customerName: name,
      customerPhone: phone,
      project: projectId || null,
      projectName,
      preferredDate: parsedDate,
      preferredTime: time,
      numberOfVisitors: visitors || 1,
      notes: notes || "",
      status: "Confirmed"
    });

    // Alert admin
    const adminAlertText = 
      `📅 *NEW SITE VISIT*\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Project: ${projectName}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Visitors: ${visitors || 1}\n` +
      `Notes: ${notes || "None"}\n` +
      `Reference ID: ${apt.referenceId}`;
    await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlertText);

    // Confirm to customer
    const customerConfirmText = 
      `Hello ${name}\n` +
      `Your Site Visit is Confirmed.\n` +
      `Project: ${projectName}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Reference: ${apt.referenceId}\n` +
      `Thank you.`;
    await whatsappService.sendTextMessage(phone, customerConfirmText);

    return res.status(200).json({ success: true, data: apt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/test-reminder
 * Manually trigger a reminder for a given appointment ID
 */
export const testReminder = async (req, res) => {
  try {
    const { appointmentId, reminderType } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Missing appointmentId in body" });
    }

    const apt = await Appointment.findById(appointmentId);
    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const type = reminderType || "30m";
    const dateStr = apt.preferredDate.toLocaleDateString("en-IN");
    
    const response = await whatsappService.sendAppointmentReminder(apt.customerPhone, {
      customerName: apt.customerName,
      date: dateStr,
      time: apt.preferredTime,
      projectName: apt.projectName || "General",
      relativeTimeText: "upcoming"
    });

    await ReminderLog.create({
      appointmentId: apt._id,
      reminderType: type,
      status: "sent",
      attemptCount: 1,
      metaResponse: response
    });

    return res.status(200).json({ success: true, message: "Manual reminder message triggered successfully", data: response });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/whatsapp/stats
 * WhatsApp analytics endpoints for dashboard
 */
export const getWhatsAppStats = async (req, res) => {
  try {
    const isConfigured = !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId);
    
    const maskId = (id) => {
      if (!id) return "Not Configured";
      return `*...${id.slice(-4)}`;
    };

    const phoneIdMasked = maskId(whatsappConfig.phoneNumberId);
    const businessIdMasked = maskId(whatsappConfig.businessAccountId);

    const latestWebhook = await WebhookLog.findOne().sort({ createdAt: -1 });
    const lastWebhookTime = latestWebhook ? latestWebhook.createdAt : null;

    const latestMsg = await WebhookLog.findOne({ eventType: "message" }).sort({ createdAt: -1 });
    const lastMsgTime = latestMsg ? latestMsg.createdAt : null;
    const lastMsgDirection = latestMsg ? "incoming" : null;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalToday = await WebhookLog.countDocuments({
      createdAt: { $gte: startOfToday },
      eventType: "message"
    });

    const totalFailed = await WebhookLog.countDocuments({
      createdAt: { $gte: startOfToday },
      error: { $ne: null }
    });

    const totalSuccess = await WebhookLog.countDocuments({
      createdAt: { $gte: startOfToday },
      processed: true
    });

    return res.status(200).json({
      success: true,
      data: {
        connectionStatus: isConfigured ? "Connected" : "Disconnected",
        phoneNumberId: phoneIdMasked,
        businessAccountId: businessIdMasked,
        webhookStatus: lastWebhookTime,
        lastMessage: lastMsgTime ? { timestamp: lastMsgTime, direction: lastMsgDirection } : null,
        totalToday,
        totalFailed,
        totalSuccess
      }
    });
  } catch (err) {
    console.error("[WhatsApp Stats] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   LEGACY ENDPOINTS (COMPATIBILITY)
   ───────────────────────────────────────────────────────────────────────────── */

export const sendCustomText = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: "Missing phone or message in body" });
    }
    const response = await whatsappService.sendTextMessage(phone, message);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendCustomTemplate = async (req, res) => {
  try {
    const { phone, template, language, components } = req.body;
    if (!phone || !template) {
      return res.status(400).json({ success: false, message: "Missing phone or template in body" });
    }
    const response = await whatsappService.sendTemplateMessage(phone, template, language || "en_US", components || []);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const testWhatsApp = async (req, res) => {
  try {
    const { phone, message } = req.body;
    const targetPhone = phone || whatsappConfig.adminPhoneNumber;
    const textMsg = message || "Hello from Aaditya Group of Companies";
    const response = await whatsappService.sendTextMessage(targetPhone, textMsg);
    return res.status(200).json({ success: true, message: "Test WhatsApp sent successfully", data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CRM Test Routes (admin-auth protected, registered in whatsappRoutes.js) ─
export const testChat = async (req, res) => {
  try {
    const testPhone = `test_${Date.now()}`;
    let customer = await Customer.findOneAndUpdate(
      { phone: testPhone },
      { $set: { name: "CRM Test User", lastActiveAt: new Date() } },
      { upsert: true, new: true }
    );
    let chat = await Chat.findOneAndUpdate(
      { customer: customer._id },
      { $set: { status: "Open" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const msg = await Message.create({
      chat: chat._id, direction: "incoming", messageType: "text",
      body: "Test message from CRM test route", metaMessageId: `test_${Date.now()}`,
      deliveryStatus: "delivered", timestamp: new Date()
    });
    res.status(201).json({ success: true, message: "Test chat created", data: { customer, chat, msg } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const testSocket = async (req, res) => {
  try {
    emitToAdmins("test_event", { message: "Socket.IO CRM test ping", time: new Date() });
    res.status(200).json({ success: true, message: "Socket.IO test event emitted to admins room" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const testMedia = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Simulate incoming media message — use a real Meta media webhook payload to trigger media download",
      info: "Media is downloaded from Meta and re-uploaded to Cloudinary via persistMetaMedia()"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const testReply = async (req, res) => {
  try {
    const { phone, message } = req.body;
    const targetPhone = phone || whatsappConfig.adminPhoneNumber;
    const text = message || "[CRM Test Reply] Hello from Aditya Builders CRM Dashboard";
    const response = await whatsappService.sendTextMessage(targetPhone, text);
    res.status(200).json({ success: true, message: "Test CRM reply sent", data: response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDiagnostics = async (req, res) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const isCloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    
    let isSocketConnected = false;
    try {
      const io = getIO();
      isSocketConnected = !!io;
    } catch (e) {
      // not initialized
    }

    const hasAccessToken = !!whatsappConfig.accessToken;
    const hasPhoneId = !!whatsappConfig.phoneNumberId;
    const hasBusinessId = !!whatsappConfig.businessAccountId;
    const hasAppSecret = !!whatsappConfig.appSecret;

    const report = {
      success: true,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || "development",
      mongodbConnected: isMongoConnected,
      cloudinaryConnected: isCloudinaryConfigured,
      socketConnected: isSocketConnected,
      whatsapp: {
        metaApiVersion: whatsappConfig.graphApiVersion,
        phoneIdConfigured: hasPhoneId,
        businessIdConfigured: hasBusinessId,
        accessTokenConfigured: hasAccessToken,
        appSecretConfigured: hasAppSecret,
        verifyTokenConfigured: !!whatsappConfig.verifyToken,
        verifyTokenValue: whatsappConfig.verifyToken,
        adminPhoneNumber: whatsappConfig.adminPhoneNumber,
        canSendMessages: hasAccessToken && hasPhoneId,
        canReceiveMessages: true,
        signatureValidationActive: hasAppSecret
      }
    };

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const runSelfTest = async (req, res) => {
  const report = {
    timestamp: new Date(),
    steps: []
  };

  try {
    // Step 1: Check MongoDB
    const isMongoConnected = mongoose.connection.readyState === 1;
    report.steps.push({
      name: "MongoDB Connection",
      status: isMongoConnected ? "success" : "failed",
      details: isMongoConnected ? "Connected to database" : "Disconnected"
    });

    // Step 2: Create mock incoming message payload
    const mockMessageId = `mock-test-${Date.now()}`;
    const testPhone = "919998112121";
    const testName = "Alice SelfTest";
    const mockPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: whatsappConfig.businessAccountId || "mock-business-id",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "16505553333",
                  phone_number_id: whatsappConfig.phoneNumberId || "mock-phone-id"
                },
                contacts: [
                  {
                    profile: { name: testName },
                    wa_id: testPhone
                  }
                ],
                messages: [
                  {
                    from: testPhone,
                    id: mockMessageId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: "Hi" },
                    type: "text"
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };

    report.steps.push({
      name: "Mock Payload Construction",
      status: "success",
      details: "Constructed incoming text 'Hi' message from 919998112121"
    });

    // Step 3: Trigger CRM logging & chatbot execution internally
    let loggedCrm = false;
    let logDoc = null;

    try {
      // Create WebhookLog
      logDoc = await WebhookLog.create({
        eventType: "message",
        payload: mockPayload,
        processed: true
      });

      // Call logIncomingToCRM
      const message = mockPayload.entry[0].changes[0].value.messages[0];
      await logIncomingToCRM(message, testName, testPhone, null);
      loggedCrm = true;
      
      report.steps.push({
        name: "CRM Database Logging",
        status: "success",
        details: "Logged Customer, Chat, and Message to MongoDB successfully"
      });
    } catch (crmErr) {
      report.steps.push({
        name: "CRM Database Logging",
        status: "failed",
        details: crmErr.message
      });
    }

    // Step 4: Simulate Chatbot Response
    try {
      // Send welcome menu mock/real
      const text = 
        `🏡 *Welcome to Aaditya Builders*\n\n` +
        `How may we help you today?\n\n` +
        `Reply with the option number:\n` +
        `1️⃣ New Projects\n` +
        `2️⃣ Ready Possession\n` +
        `3️⃣ Book Site Visit\n` +
        `4️⃣ Download Brochure\n` +
        `5️⃣ Contact Sales\n` +
        `6️⃣ Office Location\n` +
        `7️⃣ Contact Number`;
      
      const response = await whatsappService.sendTextMessage(testPhone, text);

      report.steps.push({
        name: "Chatbot Reply Delivery",
        status: "success",
        details: `Sent welcome menu. API Response: ${JSON.stringify(response)}`
      });
    } catch (botErr) {
      report.steps.push({
        name: "Chatbot Reply Delivery",
        status: "failed",
        details: botErr.message
      });
    }

    // Step 5: Simulate Admin Alert Notification
    try {
      const adminAlertText = 
        `🚨 *Self-Test Admin Message Alert*\n\n` +
        `👤 *Name:* ${testName}\n` +
        `📞 *Phone:* ${testPhone}\n` +
        `💬 *Message:* Self-Test executed successfully.\n` +
        `🕒 *Time:* ${new Date().toLocaleString()}`;

      const response = await whatsappService.sendTextMessage(whatsappConfig.adminPhoneNumber, adminAlertText);

      report.steps.push({
        name: "Admin Notification Delivery",
        status: "success",
        details: `Sent alert to admin phone ${whatsappConfig.adminPhoneNumber}. Response: ${JSON.stringify(response)}`
      });
    } catch (adminErr) {
      report.steps.push({
        name: "Admin Notification Delivery",
        status: "failed",
        details: adminErr.message
      });
    }

    report.success = true;
    return res.status(200).json(report);
  } catch (err) {
    report.success = false;
    report.error = err.message;
    return res.status(500).json(report);
  }
};

export default {
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
};
