import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import WebhookLog from "../models/WebhookLog.js";

async function inspectLatest() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const gopi = await Customer.findOne({ phone: { $regex: /7285077405/ } });
  if (gopi) {
    console.log(`Gopi ID: ${gopi._id}, Name: ${gopi.name}, Phone: ${gopi.phone}`);
    const chat = await Chat.findOne({ customer: gopi._id });
    if (chat) {
      const msgs = await Message.find({ chat: chat._id }).sort({ timestamp: -1 }).limit(5);
      console.log(`\nLast 5 messages for Gopi:`);
      for (const m of msgs) {
        console.log(`- Time: ${m.timestamp}`);
        console.log(`  Direction: ${m.direction}, Type: ${m.messageType}, DeliveryStatus: ${m.deliveryStatus}`);
        console.log(`  MetaMessageId: ${m.metaMessageId}`);
        console.log(`  Body: ${JSON.stringify(m.body)}`);
      }
    }
  }

  console.log(`\nInspecting recent WebhookLogs for Gopi or Meta error:`);
  const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(10);
  for (const l of logs) {
    const raw = JSON.stringify(l.payload || {});
    if (raw.includes("7285077405") || raw.includes("errors") || raw.includes("failed")) {
      console.log(`\nWebhook Time: ${l.createdAt}`);
      console.log(`Payload: ${JSON.stringify(l.payload, null, 2)}`);
    }
  }

  process.exit(0);
}

inspectLatest();
