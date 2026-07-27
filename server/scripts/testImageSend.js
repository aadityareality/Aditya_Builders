import "dotenv/config";
import mongoose from "mongoose";
import { sendImage } from "../src/services/whatsappService.js";

async function testSendImg() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Testing sendImage to Yash 919913863602...");
  try {
    const res = await sendImage("919913863602", "https://res.cloudinary.com/dcysihl0/image/upload/v1785134266/adityabuilders/inquiries/wrgnrlf3qqimhi37vprs.jpg", "aaditya builders");
    console.log("✅ Image Dispatch Result:", res);
  } catch (err) {
    console.error("❌ Send Error:", err.message);
  }
  process.exit(0);
}

testSendImg();
