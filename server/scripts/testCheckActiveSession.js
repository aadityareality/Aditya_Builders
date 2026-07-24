import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { checkActiveSession } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  const phone = "918780150610";
  console.log("🚀 Testing checkActiveSession for:", phone);
  const result = await checkActiveSession(phone);
  console.log("🏁 Result of checkActiveSession:", result);
  await mongoose.connection.close();
};

run();
