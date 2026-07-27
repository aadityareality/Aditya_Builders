import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { formatPhoneNumber } from "../src/services/whatsappService.js";

const oldSamplePhones = [
  "7405391200",
  "9426989487",
  "9313580556",
  "9033320290",
  "9898982362",
  "9426282860",
  "9408640101",
  "9979929288",
  "9824280540",
  "8460670001",
  "9428599427",
  "9426992994",
  "9428456100",
  "9925232757",
  "9825206385",
  "9825206386",
  "9427282850"
];

async function deleteOldSampleContacts() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const formattedPhones = oldSamplePhones.map(p => formatPhoneNumber(p));

  const targetCustomers = await Customer.find({
    $or: [
      { phone: { $in: oldSamplePhones } },
      { phone: { $in: formattedPhones } }
    ]
  });

  console.log(`Found ${targetCustomers.length} old sample contacts to permanently delete.`);

  let deletedCount = 0;
  for (const c of targetCustomers) {
    // Delete associated chats and messages
    const chat = await Chat.findOne({ customer: c._id });
    if (chat) {
      await Message.deleteMany({ chat: chat._id });
      await Chat.deleteOne({ _id: chat._id });
    }
    await Customer.deleteOne({ _id: c._id });
    deletedCount++;
    console.log(`🗑️ Deleted: ${c.name} (${c.phone})`);
  }

  console.log(`\nSuccessfully deleted ${deletedCount} old sample contacts.`);

  const remainingAuraCount = await Customer.countDocuments({
    $or: [{ category: "AURA" }, { tags: "AURA" }]
  });
  console.log(`Exact AURA Contacts in DB Now: ${remainingAuraCount}`);

  process.exit(0);
}

deleteOldSampleContacts();
