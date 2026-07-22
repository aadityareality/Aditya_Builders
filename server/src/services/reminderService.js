import cron from "node-cron";
import Appointment from "../../models/Appointment.js";
import ReminderLog from "../../models/ReminderLog.js";
import Customer from "../../models/Customer.js";
import whatsappService from "./whatsappService.js";
import AiSummary from "../../models/AiSummary.js";
import ConversationMemory from "../../models/ConversationMemory.js";
import Message from "../../models/Message.js";
import Chat from "../../models/Chat.js";
import { generateCompletion } from "./openAiService.js";

/**
 * Utility to parse preferredDate and preferredTime into a single JS Date object
 */
export const getAppointmentDateTime = (date, timeStr) => {
  const aptDate = new Date(date);
  try {
    const cleaned = timeStr.trim().toUpperCase();
    const match = cleaned.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      aptDate.setHours(hours, minutes, 0, 0);
    } else {
      // Default to 10:00 AM if parsing fails
      aptDate.setHours(10, 0, 0, 0);
    }
  } catch (err) {
    aptDate.setHours(10, 0, 0, 0);
  }
  return aptDate;
};

/**
 * Core function to check upcoming appointments and send reminders
 * Consolidated to 24 hours, 2 hours, and 30 minutes (Feature 8)
 */
export const checkAndSendReminders = async () => {
  console.log("[Reminder Service] Running periodic check for upcoming appointments...");
  
  try {
    const now = Date.now();
    const appointments = await Appointment.find({ status: "Confirmed" });
    
    for (const apt of appointments) {
      const aptDateTime = getAppointmentDateTime(apt.preferredDate, apt.preferredTime);
      const diffMs = aptDateTime.getTime() - now;
      const diffMins = diffMs / (1000 * 60);

      // Skip past appointments
      if (diffMins <= 0) continue;

      let reminderType = null;
      let reminderKey = null;
      let relativeTimeText = "";

      // Check windows sequentially: 24h, 2h, 30m
      if (diffMins <= 1440 && diffMins > 120 && !apt.remindersSent.h24) {
        reminderType = "24h";
        reminderKey = "h24";
        relativeTimeText = "tomorrow";
      } else if (diffMins <= 120 && diffMins > 30 && !apt.remindersSent.h2) {
        reminderType = "2h";
        reminderKey = "h2";
        relativeTimeText = "in 2 hours";
      } else if (diffMins <= 30 && diffMins > 0 && !apt.remindersSent.m30) {
        reminderType = "30m";
        reminderKey = "m30";
        relativeTimeText = "in 30 minutes";
      }

      if (reminderType && reminderKey) {
        await triggerReminderMessage(apt, reminderType, reminderKey, relativeTimeText);
      }
    }
  } catch (err) {
    console.error("[Reminder Service] Error in reminders check run:", err.message);
  }
};

/**
 * Triggers a reminder with up to 3 retries and logs the outcome
 */
const triggerReminderMessage = async (appointment, reminderType, reminderKey, relativeTimeText) => {
  console.log(`[Reminder Service] Dispatching ${reminderType} reminder to ${appointment.customerName} (${appointment.customerPhone})`);
  
  const dateStr = appointment.preferredDate.toLocaleDateString("en-IN");
  const phone = appointment.customerPhone;
  
  let success = false;
  let attempt = 0;
  let metaResponse = null;

  while (attempt < 3 && !success) {
    attempt++;
    try {
      metaResponse = await whatsappService.sendAppointmentReminder(phone, {
        customerName: appointment.customerName,
        date: dateStr,
        time: appointment.preferredTime,
        projectName: appointment.projectName || "General Site Visit",
        relativeTimeText
      });
      success = true;
    } catch (err) {
      metaResponse = { error: err.message };
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Create log in ReminderLog collection
  try {
    await ReminderLog.create({
      appointmentId: appointment._id,
      reminderType,
      status: success ? "sent" : "failed",
      attemptCount: attempt,
      metaResponse
    });
  } catch (logErr) {
    console.error("[Reminder Service] Failed to create ReminderLog entry:", logErr.message);
  }

  if (success) {
    appointment.remindersSent[reminderKey] = true;
    try {
      await appointment.save();
      console.log(`[Reminder Service] Successfully logged and sent ${reminderType} reminder.`);
    } catch (saveErr) {
      console.error("[Reminder Service] Failed to save updated appointment remindersSent flags:", saveErr.message);
    }
  } else {
    console.warn(`[Reminder Service] Failed to send ${reminderType} reminder after 3 attempts.`);
  }
};

/**
 * Smart Customer Follow-up Daemon (Feature 11)
 * Scans for WhatsApp customers who are inactive and sends reminders/offers.
 */
export const checkAndSendFollowUps = async () => {
  console.log("[Reminder Service] Scanning for inactive customers to send smart follow-ups...");
  try {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDaysMs = 3 * oneDayMs;
    const sevenDaysMs = 7 * oneDayMs;

    // Scan customers registered from WhatsApp who have not purchased/closed yet
    const customers = await Customer.find({
      source: "WhatsApp",
      stage: { $nin: ["Closed", "Site Visit Booked"] }
    });

    for (const cust of customers) {
      const inactiveMs = now - new Date(cust.lastActiveAt || cust.updatedAt).getTime();

      // 7 days inactive: send offers
      if (inactiveMs >= sevenDaysMs && !cust.followUp7daySent) {
        console.log(`[Follow-up] Sending 7-day template follow-up to ${cust.name} (${cust.phone})`);
        try {
          await whatsappService.sendTemplateMessage(cust.phone, "followup_7day", "en", [
            {
              type: "BODY",
              parameters: [{ type: "text", text: cust.name }]
            }
          ]);
          cust.followUp7daySent = true;
          await cust.save();
        } catch (err) {
          console.warn(`⚠️ Meta template followup_7day failed. Sending text fallback:`, err.message);
          await whatsappService.sendTextMessage(cust.phone, `Hello ${cust.name}, latest offers available. Would you like details?`).catch(() => {});
          cust.followUp7daySent = true;
          await cust.save();
        }
      }
      // 3 days inactive: prompt site visit
      else if (inactiveMs >= threeDaysMs && !cust.followUp3daySent && !cust.followUp7daySent) {
        console.log(`[Follow-up] Sending 3-day template follow-up to ${cust.name} (${cust.phone})`);
        try {
          await whatsappService.sendTemplateMessage(cust.phone, "followup_3day", "en", [
            {
              type: "BODY",
              parameters: [{ type: "text", text: cust.name }]
            }
          ]);
          cust.followUp3daySent = true;
          await cust.save();
        } catch (err) {
          console.warn(`⚠️ Meta template followup_3day failed. Sending text fallback:`, err.message);
          await whatsappService.sendTextMessage(cust.phone, `Hello ${cust.name}, interested in scheduling a visit?`).catch(() => {});
          cust.followUp3daySent = true;
          await cust.save();
        }
      }
      // 24 hours inactive: check in
      else if (inactiveMs >= oneDayMs && !cust.followUp24hSent && !cust.followUp3daySent && !cust.followUp7daySent) {
        console.log(`[Follow-up] Sending 24h free-text follow-up to ${cust.name} (${cust.phone})`);
        try {
          await whatsappService.sendTextMessage(cust.phone, `Hello 👋 Need more information? Reply anytime.`);
          cust.followUp24hSent = true;
          await cust.save();
        } catch (err) {
          console.error(`❌ Follow-up 24h send failed:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[Reminder Service] Error running follow-ups scan:", err.message);
  }
};

/**
 * Scans for conversations that went quiet (>30 mins) and generates AI summaries
 */
export const generateInactivitySummaries = async () => {
  console.log("[AI Summary Service] Checking for inactive conversations to summarize...");
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const customers = await Customer.find({
      lastActiveAt: { $lt: thirtyMinsAgo, $gt: oneDayAgo }
    });

    for (const customer of customers) {
      const existingSummary = await AiSummary.findOne({
        customer: customer._id,
        createdAt: { $gt: customer.lastActiveAt }
      });

      if (existingSummary) continue;

      const chat = await Chat.findOne({ customer: customer._id });
      if (!chat) continue;

      const messages = await Message.find({ chat: chat._id })
        .sort({ timestamp: 1 })
        .limit(20);

      if (messages.length === 0) continue;

      console.log(`📝 [AI Summary] Summarizing conversation for customer: ${customer.phone}`);

      const systemPrompt = `You are a CRM coordinator assistant for Aaditya Builders.
Analyze the provided chat history between our agent/AI bot and the customer.
Summarize the conversation into a JSON object with:
- "budgetMentioned": string (the client's budget if mentioned, e.g. "80 Lakhs", "1.5 Crore", otherwise empty string)
- "interestedProjects": array of strings (names of projects the customer asked about, e.g. ["Aaditya Skyline"])
- "questionsAsked": array of strings (top 2-3 questions they asked, e.g. ["RERA number?", "possession date?"])
- "appointmentBooked": boolean (true if they confirmed a site visit appointment in the text)
- "suggestedNextAction": string (a short next step for the sales representative, e.g. "Call client to follow up on 3BHK pricing")
- "summaryText": string (a 2-sentence conversational summary of the interaction)

JSON format:
{
  "budgetMentioned": "",
  "interestedProjects": [],
  "questionsAsked": [],
  "appointmentBooked": false,
  "suggestedNextAction": "",
  "summaryText": ""
}`;

      const conversationText = messages.map(m => `${m.direction}: ${typeof m.body === 'string' ? m.body : JSON.stringify(m.body)}`).join("\n");

      const aiResult = await generateCompletion(customer.phone, systemPrompt, conversationText, customer._id);
      
      let parsed = {};
      try {
        parsed = JSON.parse(aiResult.text);
      } catch {
        const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch {}
        }
      }

      if (parsed.summaryText) {
        const resolvedProjectIds = [];
        if (parsed.interestedProjects && parsed.interestedProjects.length > 0) {
          for (const projTitle of parsed.interestedProjects) {
            const proj = await mongoose.model("Project").findOne({ 
              title: { $regex: projTitle, $options: "i" },
              isActive: true
            });
            if (proj) resolvedProjectIds.push(proj._id);
          }
        }

        await AiSummary.create({
          customer: customer._id,
          budgetMentioned: parsed.budgetMentioned || "",
          interestedProjects: resolvedProjectIds,
          leadScore: customer.leadScore,
          questionsAsked: parsed.questionsAsked || [],
          appointmentBooked: parsed.appointmentBooked || false,
          suggestedNextAction: parsed.suggestedNextAction || "Call customer",
          summaryText: parsed.summaryText
        });

        let memory = await ConversationMemory.findOne({ customer: customer._id });
        if (memory) {
          memory.lastSummary = parsed.summaryText;
          await memory.save();
        }

        console.log(`✅ [AI Summary] Saved summary for customer ${customer.phone}`);
      }
    }
  } catch (err) {
    console.error("❌ generateInactivitySummaries Error:", err.message);
  }
};

/**
 * Initialize consolidated node-cron tasks (Interval: every 15 minutes)
 */
export const initReminderCron = () => {
  cron.schedule("*/15 * * * *", async () => {
    await checkAndSendReminders();
    await checkAndSendFollowUps();
    await generateInactivitySummaries();
  });
  console.log("⏰ Consolidated node-cron reminders & smart follow-ups task registered (Interval: 15 mins).");
};

export default {
  getAppointmentDateTime,
  checkAndSendReminders,
  checkAndSendFollowUps,
  generateInactivitySummaries,
  initReminderCron,
};
