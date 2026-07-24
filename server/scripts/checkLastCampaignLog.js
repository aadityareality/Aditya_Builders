import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import CampaignLog from "../models/CampaignLog.js";

const run = async () => {
  await connectDB();
  const logs = await CampaignLog.find().sort({ createdAt: -1 }).limit(5);
  console.log("=== LATEST CAMPAIGN LOGS ===");
  for (const log of logs) {
    console.log(`Campaign: ${log.campaignName}`);
    console.log(`Customer: ${log.customerName} (${log.phone})`);
    console.log(`Status: ${log.status}`);
    console.log(`Error: ${log.errorDetails}`);
    console.log(`Message Preview: "${log.messagePreview}"`);
    console.log(`Time: ${log.createdAt}`);
    console.log("----------------------------");
  }
  await mongoose.connection.close();
};

run();
