import "dotenv/config";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { sendImage } from "../src/services/whatsappService.js";

async function inspectAndTestPriya() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const priya = await Customer.findOne({ phone: { $regex: /8799008221/ } });
  if (!priya) {
    console.log("Priya not found.");
    process.exit(0);
  }

  console.log(`Priya ID: ${priya._id}, Name: ${priya.name}, Phone: '${priya.phone}'`);

  // Test sending image to Priya
  console.log("\nTesting sendImage to Priya...");
  try {
    const res = await sendImage(priya.phone, "https://res.cloudinary.com/dcysihl0/image/upload/v1785134266/adityabuilders/inquiries/wrgnrlf3qqimhi37vprs.jpg", "hiii");
    console.log("✅ Result:", res);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }

  process.exit(0);
}

inspectAndTestPriya();
