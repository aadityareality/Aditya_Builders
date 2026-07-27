import "dotenv/config";
import mongoose from "mongoose";
import { sendTextMessage } from "../src/services/whatsappService.js";

async function testSend() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Testing sendTextMessage to Ramesh 917567232413...");
  try {
    const res = await sendTextMessage("917567232413", "Hello Ramesh, this is a test from Aditya Builders.");
    console.log("✅ Dispatch Result:", res);
  } catch (err) {
    console.error("❌ Send Error:", err.message);
  }
  process.exit(0);
}

testSend();
