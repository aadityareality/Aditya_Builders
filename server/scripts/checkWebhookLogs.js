import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import WebhookLog from "../models/WebhookLog.js";

const checkLogs = async () => {
  try {
    await connectDB();
    console.log("Reading latest 5 webhook logs...");
    const logs = await WebhookLog.find().sort({ createdAt: -1 }).limit(5);
    
    if (logs.length === 0) {
      console.log("No webhook logs found in database.");
    } else {
      logs.forEach((log, index) => {
        console.log(`\n--- Webhook Log ${index + 1} ---`);
        console.log(`Time: ${log.createdAt}`);
        console.log(`Event: ${log.eventType}`);
        console.log(`Processed: ${log.processed}`);
        console.log(`Error: ${log.error || "None"}`);
        console.log(`Payload Preview:`, JSON.stringify(log.payload, null, 2).substring(0, 500));
      });
    }
  } catch (err) {
    console.error("Error reading logs:", err);
  } finally {
    await mongoose.connection.close();
  }
};

checkLogs();
