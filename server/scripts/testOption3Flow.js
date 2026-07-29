import "dotenv/config";
import mongoose from "mongoose";
import { startSiteVisitBookingFlow } from "../src/controllers/whatsappController.js";
import ConversationState from "../models/ConversationState.js";

async function testOption3() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const phone = "919725454581";
  console.log("🚀 Testing Option 3 trigger: startSiteVisitBookingFlow...");

  await startSiteVisitBookingFlow(phone);

  const state = await ConversationState.findOne({ phone });
  console.log(`✅ State created: currentStep ${state?.currentStep}`);

  process.exit(0);
}

testOption3();
