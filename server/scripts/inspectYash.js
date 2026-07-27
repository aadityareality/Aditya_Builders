import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

async function inspectYash() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const yashCustomers = await Customer.find({ name: { $regex: /yash/i } });
  console.log(`Found ${yashCustomers.length} customers named Yash:`);
  for (const c of yashCustomers) {
    console.log(`\nID: ${c._id}, Name: ${c.name}, Phone: '${c.phone}', Category: ${c.category}, Created: ${c.createdAt}`);
    const chat = await Chat.findOne({ customer: c._id });
    if (chat) {
      const msgCount = await Message.countDocuments({ chat: chat._id });
      const lastMsg = await Message.findOne({ chat: chat._id }).sort({ timestamp: -1 });
      console.log(`  Chat ID: ${chat._id}, Status: ${chat.status}, Total Messages: ${msgCount}, Last Msg: ${lastMsg ? JSON.stringify(lastMsg.body) : 'None'}`);
    } else {
      console.log(`  No chat found for this customer.`);
    }
  }

  // Also search for phone numbers ending with 9913863602
  const phoneMatch = await Customer.find({ phone: { $regex: /9913863602/ } });
  console.log(`\nFound ${phoneMatch.length} customers matching phone 9913863602:`);
  for (const c of phoneMatch) {
    console.log(`ID: ${c._id}, Name: ${c.name}, Phone: '${c.phone}'`);
  }

  process.exit(0);
}

inspectYash();
