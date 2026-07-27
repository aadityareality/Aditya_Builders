import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

async function inspectYashChat() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const yash = await Customer.findOne({ phone: "919913863602" });
  if (!yash) {
    console.log("Yash customer not found.");
    process.exit(0);
  }

  console.log(`Yash Customer ID: ${yash._id}, Name: ${yash.name}, Phone: ${yash.phone}`);
  const chat = await Chat.findOne({ customer: yash._id });
  if (!chat) {
    console.log("No chat found for Yash.");
    process.exit(0);
  }

  const msgs = await Message.find({ chat: chat._id }).sort({ timestamp: -1 });
  console.log(`Found ${msgs.length} messages in Yash chat:`);
  for (const m of msgs) {
    console.log(`\n- ID: ${m._id}`);
    console.log(`  Direction: ${m.direction}, MessageType: ${m.messageType}, DeliveryStatus: ${m.deliveryStatus}`);
    console.log(`  MetaMessageId: ${m.metaMessageId}`);
    console.log(`  Body: ${JSON.stringify(m.body)}`);
    console.log(`  Timestamp: ${m.timestamp}`);
  }

  process.exit(0);
}

inspectYashChat();
