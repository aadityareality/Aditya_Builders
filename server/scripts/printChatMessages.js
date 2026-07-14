import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const run = async () => {
  try {
    await connectDB();

    const customer = await Customer.findOne({ phone: "918780150610" });
    if (!customer) {
      console.log("❌ Customer not found!");
      process.exit(1);
    }
    console.log(`👤 Customer: ${customer.name} (${customer.phone})`);

    const chat = await Chat.findOne({ customer: customer._id });
    if (!chat) {
      console.log("❌ Chat thread not found!");
      process.exit(1);
    }
    console.log(`💬 Chat ID: ${chat._id}`);

    const messages = await Message.find({ chat: chat._id }).sort({ timestamp: 1 });
    console.log(`📊 Message Count: ${messages.length}\n`);

    messages.forEach((msg, idx) => {
      console.log(`--- [Message #${idx + 1}] ---`);
      console.log(`ID       : ${msg._id}`);
      console.log(`Direction: ${msg.direction}`);
      console.log(`Type     : ${msg.messageType}`);
      console.log(`Status   : ${msg.deliveryStatus}`);
      console.log(`Time     : ${msg.timestamp.toISOString()}`);
      console.log(`Body     :`, JSON.stringify(msg.body, null, 2));
      console.log(`SentBy   : ${msg.sentBy}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Print error:", err);
    process.exit(1);
  }
};

run();
