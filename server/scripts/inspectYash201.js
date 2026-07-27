import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import WebhookLog from "../models/WebhookLog.js";
import Message from "../models/Message.js";

async function inspectYash201() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(20);
  console.log("Checking WebhookLogs at 02:01 PM:");
  for (const l of logs) {
    const raw = JSON.stringify(l.payload || {});
    if (raw.includes("9913863602") || raw.includes("8780221148") || raw.includes("errors")) {
      console.log(`\nWebhook Time: ${l.createdAt}`);
      console.log(`Payload: ${JSON.stringify(l.payload, null, 2)}`);
    }
  }

  process.exit(0);
}

inspectYash201();
