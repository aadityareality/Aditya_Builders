import "dotenv/config";
import mongoose from "mongoose";
import { sendTextMessage } from "../src/services/whatsappService.js";

async function testSend() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const testPhone = "919974858500"; // Test number or business number
  const testName = "Yakshit Koshiya";
  const testMsg = "hiiiii";

  console.log(`\n🚀 Testing new personalized WhatsApp message format to ${testPhone}...`);
  try {
    const res = await sendTextMessage(testPhone, testMsg, testName);
    console.log("✅ Message sent successfully!");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ Send error:", err.message);
  }

  process.exit(0);
}

testSend();
