import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Message from "../models/Message.js";

async function inspectMessages() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const msgs = await Message.find({ chat: "6796338b0d2d3e414c185bbb" });
  console.log(`Found ${msgs.length} messages in Yash chat:`);
  for (const m of msgs) {
    console.log(`- ID: ${m._id}, Direction: ${m.direction}, Body: ${JSON.stringify(m.body)}, Timestamp: ${m.timestamp}`);
  }
  process.exit(0);
}

inspectMessages();
