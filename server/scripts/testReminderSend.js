import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Appointment from "../models/Appointment.js";
import ReminderLog from "../models/ReminderLog.js";
import { sendManualReminder } from "../controllers/adminAppointmentController.js";

const run = async () => {
  await connectDB();
  
  // Clean up previous runs
  await Customer.deleteMany({ phone: "918780150610" });
  await Appointment.deleteMany({ customerPhone: "918780150610" });
  
  // 1. Create a Customer
  const cust = await Customer.create({
    name: "Yakshit Test",
    phone: "918780150610",
    source: "Manual Add",
  });
  
  // 2. Create an Appointment
  const apt = await Appointment.create({
    customerName: "Yakshit Test",
    customerPhone: "918780150610",
    preferredDate: new Date(),
    preferredTime: "11:00 AM",
    projectName: "Aaditya Skyline",
    status: "Confirmed"
  });
  
  console.log("📝 Initial Setup:");
  console.log("- Customer exists:", !!(await Customer.findById(cust._id)));
  console.log("- Appointment exists:", !!(await Appointment.findById(apt._id)));
  
  // 3. Call sendManualReminder controller
  const req = {
    params: { id: apt._id }
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };
  
  await sendManualReminder(req, res, () => {});
  
  console.log("🔔 Reminder dispatch completed:");
  console.log("- Response code:", res.statusCode);
  console.log("- Response body:", JSON.stringify(res.jsonData, null, 2));
  
  const latestLog = await ReminderLog.findOne({ appointmentId: apt._id }).sort({ createdAt: -1 });
  console.log("- Latest Reminder Log in DB:", JSON.stringify(latestLog, null, 2));

  // Clean up
  await Customer.deleteMany({ phone: "918780150610" });
  await Appointment.deleteMany({ customerPhone: "918780150610" });
  
  if (res.statusCode === 200 && latestLog?.status === "sent") {
    console.log("✅ sendManualReminder validation passed perfectly!");
  } else {
    console.error("❌ sendManualReminder validation failed!");
  }
  
  await mongoose.connection.close();
};

run();
