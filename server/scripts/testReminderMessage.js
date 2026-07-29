import "dotenv/config";
import mongoose from "mongoose";
import { sendAppointmentReminder } from "../src/services/whatsappService.js";

async function testReminder() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const customerName = "Dz Infotech";
  const phone = "919725454581"; // Test number
  const projectName = "Aaditya Elegance";
  const time = "11:00 AM";
  const relativeTimeText = "upcoming";

  console.log("🚀 Testing sendAppointmentReminder format output...");
  try {
    const res = await sendAppointmentReminder(phone, {
      customerName,
      date: "Today",
      time,
      projectName,
      relativeTimeText
    });
    console.log("✅ Reminder sent successfully!");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ Reminder error:", err.message);
  }

  process.exit(0);
}

testReminder();
