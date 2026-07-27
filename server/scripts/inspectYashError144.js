import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import WebhookLog from "../models/WebhookLog.js";
import Message from "../models/Message.js";

async function inspectYash144() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const msgs = await Message.find({}).sort({ timestamp: -1 }).limit(10);
  console.log("Last 10 messages in DB:");
  for (const m of msgs) {
    console.log(`- Time: ${m.timestamp}`);
    console.log(`  Direction: ${m.direction}, Type: ${m.messageType}, DeliveryStatus: ${m.deliveryStatus}`);
    console.log(`  MetaMessageId: ${m.metaMessageId}`);
    console.log(`  Body: ${JSON.stringify(m.body)}`);
  }

  console.log("\nInspecting recent WebhookLogs:");
  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(10);
  for (const l of logs) {
    const raw = JSON.stringify(l.payload || {});
    if (raw.includes("9913863602") || raw.includes("errors") || raw.includes("failed")) {
      console.log(`\nWebhook Time: ${l.createdAt}`);
      console.log(`Payload: ${JSON.stringify(l.payload, null, 2)}`);
    }
  }

  process.exit(0);
}

inspectYash144();
