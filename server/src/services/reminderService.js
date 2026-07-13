import cron from "node-cron";
import Appointment from "../../models/Appointment.js";
import ReminderLog from "../../models/ReminderLog.js";
import Customer from "../../models/Customer.js";
import whatsappService from "./whatsappService.js";

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
          await whatsappService.sendTemplateMessage(cust.phone, "followup_7day", "en_US", [
            {
              type: "body",
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
          await whatsappService.sendTemplateMessage(cust.phone, "followup_3day", "en_US", [
            {
              type: "body",
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
 * Initialize consolidated node-cron tasks (Interval: every 15 minutes)
 */
export const initReminderCron = () => {
  cron.schedule("*/15 * * * *", async () => {
    await checkAndSendReminders();
    await checkAndSendFollowUps();
  });
  console.log("⏰ Consolidated node-cron reminders & smart follow-ups task registered (Interval: 15 mins).");
};

export default {
  getAppointmentDateTime,
  checkAndSendReminders,
  checkAndSendFollowUps,
  initReminderCron,
};
