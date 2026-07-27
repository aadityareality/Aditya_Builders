import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

async function mergeDuplicateCustomers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const customers = await Customer.find({ phone: { $not: /^BLANK_/ } });
    const phoneMap = new Map();

    for (const c of customers) {
      const clean = c.phone.replace(/[^0-9]/g, "");
      if (clean.length < 10) continue;
      const last10 = clean.slice(-10);

      if (!phoneMap.has(last10)) {
        phoneMap.set(last10, []);
      }
      phoneMap.get(last10).push(c);
    }

    let mergedCount = 0;
    for (const [last10, list] of phoneMap.entries()) {
      if (list.length > 1) {
        console.log(`\nFound ${list.length} duplicates for phone ending in ${last10}:`);
        
        // Sort: preferred primary customer has category !== "General" or non-default name
        list.sort((a, b) => {
          if (a.category !== "General" && b.category === "General") return -1;
          if (a.category === "General" && b.category !== "General") return 1;
          if (a.name !== "Customer" && b.name === "Customer") return -1;
          if (a.name === "Customer" && b.name !== "Customer") return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const primary = list[0];
        const duplicates = list.slice(1);

        console.log(`  -> Primary: ID ${primary._id}, Name: '${primary.name}', Phone: '${primary.phone}'`);

        // First, delete duplicates so unique index doesn't conflict
        for (const dup of duplicates) {
          console.log(`  -> Merging duplicate: ID ${dup._id}, Name: '${dup.name}', Phone: '${dup.phone}'`);
          
          const dupChat = await Chat.findOne({ customer: dup._id });
          let primaryChat = await Chat.findOne({ customer: primary._id });

          if (dupChat) {
            if (!primaryChat) {
              dupChat.customer = primary._id;
              await dupChat.save();
            } else {
              // Move all messages from dupChat to primaryChat
              await Message.updateMany({ chat: dupChat._id }, { $set: { chat: primaryChat._id } });
              await Chat.deleteOne({ _id: dupChat._id });
            }
          }

          // Delete duplicate customer record
          await Customer.deleteOne({ _id: dup._id });
          mergedCount++;
        }

        // Now normalize primary phone to 12-digit standard (91XXXXXXXXXX)
        const primaryClean = primary.phone.replace(/[^0-9]/g, "");
        if (primaryClean.length === 10) {
          primary.phone = "91" + primaryClean;
          await primary.save();
        }
      } else {
        // Single customer — ensure phone is normalized to 91XXXXXXXXXX if 10 digits
        const c = list[0];
        const clean = c.phone.replace(/[^0-9]/g, "");
        if (clean.length === 10) {
          c.phone = "91" + clean;
          await c.save();
        }
      }
    }

    console.log(`\n✅ Merged ${mergedCount} duplicate customer profiles successfully! All customer numbers normalized.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error merging duplicate customers:", err);
    process.exit(1);
  }
}

mergeDuplicateCustomers();
