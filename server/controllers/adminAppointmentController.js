import Appointment from "../models/Appointment.js";
import catchAsync from "../utils/catchAsync.js";
import whatsappService from "../src/services/whatsappService.js";
import { getAppointmentDateTime } from "../src/services/reminderService.js";
import ReminderLog from "../models/ReminderLog.js";

/**
 * GET /api/admin/appointments
 * Fetch list of appointments with filters & search
 */
export const getAppointments = catchAsync(async (req, res) => {
  const { status, project, search, page = 1, limit = 100 } = req.query;

  const query = {};

  if (status) query.status = status;
  if (project) query.project = project;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { customerName: searchRegex },
      { customerPhone: searchRegex },
      { projectName: searchRegex },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .sort({ preferredDate: 1, preferredTime: 1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("project", "title location");

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: appointments,
  });
});

/**
 * POST /api/admin/appointments/:id/reminder
 * Trigger manual reminder message
 */
export const sendManualReminder = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  const dateStr = appointment.preferredDate.toLocaleDateString("en-IN");
  let success = false;
  let attempt = 0;
  let metaResponse = null;

  while (attempt < 3 && !success) {
    attempt++;
    try {
      metaResponse = await whatsappService.sendAppointmentReminder(appointment.customerPhone, {
        customerName: appointment.customerName,
        date: dateStr,
        time: appointment.preferredTime,
        projectName: appointment.projectName || "General",
        relativeTimeText: "upcoming"
      });
      success = true;
    } catch (err) {
      metaResponse = { error: err.message };
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Create log in ReminderLog
  await ReminderLog.create({
    appointmentId: appointment._id,
    reminderType: "30m", // Tag as manual trigger
    status: success ? "sent" : "failed",
    attemptCount: attempt,
    metaResponse
  });

  if (success) {
    res.status(200).json({ success: true, message: "Reminder sent successfully" });
  } else {
    res.status(500).json({ success: false, message: "Failed to send reminder after 3 attempts", error: metaResponse });
  }
});

/**
 * PATCH /api/admin/appointments/:id/cancel
 * Cancel appointment
 */
export const cancelAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  appointment.status = "Cancelled";
  await appointment.save();

  // Send cancellation alert to customer
  try {
    const text = `Hello ${appointment.customerName},\nYour scheduled site visit for project "${appointment.projectName || "General"}" has been Cancelled.\nIf you wish to reschedule, please visit our website.`;
    await whatsappService.sendTextMessage(appointment.customerPhone, text);
  } catch (err) {
    console.warn("Failed to notify customer of cancellation:", err.message);
  }

  res.status(200).json({ success: true, data: appointment });
});

/**
 * PATCH /api/admin/appointments/:id/reschedule
 * Reschedule appointment manually
 */
export const rescheduleAppointment = catchAsync(async (req, res) => {
  const { preferredDate, preferredTime } = req.body;
  if (!preferredDate || !preferredTime) {
    return res.status(400).json({ success: false, message: "Missing preferredDate or preferredTime" });
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  appointment.preferredDate = new Date(preferredDate);
  appointment.preferredTime = preferredTime;
  appointment.status = "Rescheduled";
  appointment.remindersSent = { h24: false, h3: false, h1: false, m30: false }; // reset reminders
  await appointment.save();

  // Send confirmation alert to customer
  try {
    const text = `Hello ${appointment.customerName},\nYour site visit has been Rescheduled by the admin.\nProject: ${appointment.projectName || "General"}\nNew Date: ${appointment.preferredDate.toLocaleDateString("en-IN")}\nNew Time: ${appointment.preferredTime}\nReference: ${appointment.referenceId}\nThank you.`;
    await whatsappService.sendTextMessage(appointment.customerPhone, text);
  } catch (err) {
    console.warn("Failed to notify customer of manual reschedule:", err.message);
  }

  res.status(200).json({ success: true, data: appointment });
});
