import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

async function cleanRemainingGeneral() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all customers whose category is 'General' or blank
  const legacyGeneral = await Customer.find({
    $or: [{ category: "General" }, { category: "" }, { category: null }]
  });

  console.log(`Found ${legacyGeneral.length} unassigned / General contacts.`);

  let deletedCount = 0;
  for (const c of legacyGeneral) {
    // Check if this contact has any active tags (e.g. AURA, SKYLINE, etc.)
    const projectTags = (c.tags || []).filter(t => t !== "General");
    if (projectTags.length > 0) {
      c.category = projectTags[0];
      await c.save();
      console.log(`✏️ Fixed category for ${c.name}: set category to ${c.category}`);
    } else {
      // Delete legacy sample contact unassigned to any project
      const chat = await Chat.findOne({ customer: c._id });
      if (chat) {
        await Message.deleteMany({ chat: chat._id });
        await Chat.deleteOne({ _id: chat._id });
      }
      await Customer.deleteOne({ _id: c._id });
      deletedCount++;
      console.log(`🗑️ Removed unassigned legacy contact: ${c.name} (${c.phone})`);
    }
  }

  const remainingGeneral = await Customer.countDocuments({
    $or: [{ category: "General" }, { category: "" }, { category: null }]
  });

  console.log(`\n=======================================================`);
  console.log(`Deleted ${deletedCount} unassigned legacy contacts.`);
  console.log(`Remaining General Category Contacts in DB: ${remainingGeneral}`);
  console.log(`Total Unique Contacts in DB Now: ${await Customer.countDocuments()}`);
  console.log(`=======================================================`);

  process.exit(0);
}

cleanRemainingGeneral();
