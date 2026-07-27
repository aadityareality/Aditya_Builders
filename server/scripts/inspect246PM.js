import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import WebhookLog from "../models/WebhookLog.js";

async function inspect246PM() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(10);
  for (const l of logs) {
    console.log(`\nWebhook Time: ${l.createdAt}`);
    console.log(JSON.stringify(l.payload, null, 2));
  }

  process.exit(0);
}

inspect246PM();
