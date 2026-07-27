import "dotenv/config";
import mongoose from "mongoose";
import { sendTextMessage, sendImage } from "../src/services/whatsappService.js";

async function testGopi() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Testing text & image dispatch to Gopi 917285077405...");
  
  try {
    const textRes = await sendTextMessage("917285077405", "Hello Gopi, this is a test message from Aditya Builders.");
    console.log("✅ Text Dispatch Result:", textRes);
  } catch (err) {
    console.error("❌ Text Error:", err.message);
  }

  try {
    const imgRes = await sendImage("917285077405", "https://res.cloudinary.com/dcysihl0/image/upload/v1785138629/adityabuilders/inquiries/grn7rfcohyx1oqgskrqt.jpg", "kem che?");
    console.log("✅ Image Dispatch Result:", imgRes);
  } catch (err) {
    console.error("❌ Image Error:", err.message);
  }

  process.exit(0);
}

testGopi();
