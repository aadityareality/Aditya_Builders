import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import WebhookLog from "../models/WebhookLog.js";

async function inspectWebhookError() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(20);
  console.log(`Inspecting last ${logs.length} webhook logs:`);

  for (const l of logs) {
    const raw = JSON.stringify(l.payload || {});
    if (raw.includes("status") || raw.includes("error")) {
      console.log(`\nWebhook Time: ${l.createdAt}`);
      console.log(`Payload: ${JSON.stringify(l.payload, null, 2)}`);
    }
  }

  process.exit(0);
}

inspectWebhookError();
