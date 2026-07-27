import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import WebhookLog from "../models/WebhookLog.js";
import Message from "../models/Message.js";

async function inspectErrors() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(30);
  console.log(`Checking last ${logs.length} webhook logs for error details...`);

  for (const l of logs) {
    const raw = JSON.stringify(l.payload || {});
    if (raw.includes("7285077405") || raw.includes("8799008221") || raw.includes("errors")) {
      console.log(`\nWebhook Time: ${l.createdAt}`);
      console.log(`Payload: ${JSON.stringify(l.payload, null, 2)}`);
    }
  }

  process.exit(0);
}

inspectErrors();
