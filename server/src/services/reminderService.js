import cron from "node-cron";
import Appointment from "../../models/Appointment.js";
import ReminderLog from "../../models/ReminderLog.js";
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

      // Check windows sequentially
      if (diffMins <= 1440 && diffMins > 180 && !apt.remindersSent.h24) {
        reminderType = "24h";
        reminderKey = "h24";
        relativeTimeText = "tomorrow";
      } else if (diffMins <= 180 && diffMins > 60 && !apt.remindersSent.h3) {
        reminderType = "3h";
        reminderKey = "h3";
        relativeTimeText = "in 3 hours";
      } else if (diffMins <= 60 && diffMins > 30 && !apt.remindersSent.h1) {
        reminderType = "1h";
        reminderKey = "h1";
        relativeTimeText = "in 1 hour";
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
        projectName: appointment.projectName || "General",
        relativeTimeText
      });
      success = true;
    } catch (err) {
      metaResponse = { error: err.message };
      if (attempt < 3) {
        // Sleep 2 seconds before retry
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
 * Initialize node-cron task
 */
export const initReminderCron = () => {
  // Runs every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    await checkAndSendReminders();
  });
  console.log("⏰ node-cron reminders task registered successfully (Interval: 15 mins).");
};

export default {
  getAppointmentDateTime,
  checkAndSendReminders,
  initReminderCron,
};
