import "dotenv/config";
import mongoose from "mongoose";
import { sendImage } from "../src/services/whatsappService.js";

async function testSendImage() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const phone = "918238285656"; // Mahipal's phone number
  const name = "MAHIPALSINH SOLANKI";
  const imageUrl = "https://res.cloudinary.com/dcysihl0/image/upload/v1785231862/adityabuilders/inquiries/r5uuljwcko20k8i7yxmd.jpg";
  const caption = "Check out our latest property update!";

  console.log(`🚀 Sending test image to ${name} (${phone})...`);

  try {
    const res = await sendImage(phone, imageUrl, caption, name);
    console.log("✅ SUCCESS! Response:");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ Send image error:", err.message);
  }

  process.exit(0);
}

testSendImage();
