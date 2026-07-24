import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  const to = "918780150610";
  const text = "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?";
  
  console.log("🚀 Testing sendTextMessage directly with DB connected...");
  try {
    const res = await sendTextMessage(to, text);
    console.log("✅ Success:", res);
  } catch (err) {
    console.error("❌ Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
  await mongoose.connection.close();
};

run();
