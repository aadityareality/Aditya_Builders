import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const phone = "918780150610"; // Yakshit test phone

const run = async () => {
  await connectDB();

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  console.log("=== SESSION DIAGNOSTIC FOR", cleanPhone, "===\n");

  // 1. Find customer
  const customer = await Customer.findOne({
    phone: { $regex: new RegExp(cleanPhone.slice(-10) + "$") }
  });
  console.log("1. Customer found:", customer ? `${customer.name} (${customer._id})` : "❌ NOT FOUND");
  if (!customer) { await mongoose.connection.close(); return; }

  // 2. Find chat
  const chat = await Chat.findOne({ customer: customer._id });
  console.log("2. Chat found:", chat ? `${chat._id}` : "❌ NOT FOUND");
  if (!chat) { await mongoose.connection.close(); return; }

  // 3. All messages in chat
  const allMsgs = await Message.find({ chat: chat._id }).sort({ timestamp: -1 }).limit(10);
  console.log(`3. Total messages in chat: ${allMsgs.length}`);
  for (const m of allMsgs) {
    console.log(`   - [${m.direction}] "${m.body?.substring(0, 40) || m.type}" at ${new Date(m.timestamp).toLocaleString()}`);
  }

  // 4. Last INCOMING message
  const lastIncoming = await Message.findOne({ chat: chat._id, direction: "incoming" })
    .sort({ timestamp: -1 });
  console.log("\n4. Last INCOMING message:", lastIncoming
    ? `"${lastIncoming.body?.substring(0, 40)}" at ${new Date(lastIncoming.timestamp).toLocaleString()}`
    : "❌ NONE FOUND");

  if (lastIncoming) {
    const diff = Date.now() - new Date(lastIncoming.timestamp).getTime();
    const hoursAgo = (diff / (1000 * 60 * 60)).toFixed(1);
    console.log(`   Hours ago: ${hoursAgo}h → Active session: ${diff < 24 * 60 * 60 * 1000 ? "✅ YES" : "❌ NO (>24h)"}`);
  }

  await mongoose.connection.close();
};

run();
