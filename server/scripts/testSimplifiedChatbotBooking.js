import "dotenv/config";
import mongoose from "mongoose";
import { handleSiteVisitBooking, startSiteVisitBookingFlow } from "../src/controllers/whatsappController.js";
import ConversationState from "../models/ConversationState.js";

async function testBookingFlow() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const testPhone = "919725454581";

  console.log("🚀 Step 1: Starting site visit booking flow...");
  await startSiteVisitBookingFlow(testPhone, null, null, { projectName: "Aaditya Elegance" });

  let state = await ConversationState.findOne({ phone: testPhone });
  console.log(`State created: step ${state.currentStep}`);

  console.log("🚀 Step 2: Customer enters Name 'Yash'...");
  await handleSiteVisitBooking(testPhone, "Yash", state, "Yash");

  state = await ConversationState.findOne({ phone: testPhone });
  console.log(`State updated: step ${state.currentStep}, collected name: ${state.collectedData.name}`);

  console.log("🚀 Step 3: Customer replies 'YES' to phone confirmation...");
  await handleSiteVisitBooking(testPhone, "YES", state, "Yash");

  state = await ConversationState.findOne({ phone: testPhone });
  console.log(`State updated: step ${state.currentStep}, collected phone: ${state.collectedData.phone}`);

  console.log("🚀 Step 4: Customer replies 'YES' to review details...");
  await handleSiteVisitBooking(testPhone, "YES", state, "Yash");

  console.log("✅ Simplified 2-step booking flow test finished successfully!");
  process.exit(0);
}

testBookingFlow();
