import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

async function inspectRamesh() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const rameshList = await Customer.find({ phone: { $regex: /7567232413/ } });
  console.log(`Found ${rameshList.length} customers matching phone 7567232413:`);
  for (const c of rameshList) {
    console.log(`\nCustomer ID: ${c._id}, Name: ${c.name}, Phone: '${c.phone}', Category: ${c.category}`);
    const chat = await Chat.findOne({ customer: c._id });
    if (chat) {
      console.log(`  Chat ID: ${chat._id}, Status: ${chat.status}`);
      const msgs = await Message.find({ chat: chat._id }).sort({ timestamp: -1 });
      console.log(`  Found ${msgs.length} messages:`);
      for (const m of msgs) {
        console.log(`    - Direction: ${m.direction}, DeliveryStatus: ${m.deliveryStatus}, MetaMessageId: ${m.metaMessageId}, Body: ${JSON.stringify(m.body)}`);
      }
    }
  }

  process.exit(0);
}

inspectRamesh();
