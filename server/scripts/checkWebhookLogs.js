import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import WebhookLog from "../models/WebhookLog.js";

const run = async () => {
  await connectDB();
  const list = await WebhookLog.find().sort({ createdAt: -1 }).limit(10);
  console.log("Latest Webhook Logs:");
  list.forEach(w => {
    console.log(`- Time: ${w.createdAt?.toISOString()}`);
    console.log(`  Payload: ${JSON.stringify(w.payload).substring(0, 300)}`);
  });
  await mongoose.connection.close();
};
run();
