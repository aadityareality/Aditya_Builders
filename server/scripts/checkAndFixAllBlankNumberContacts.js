import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function checkAndFixAllBlankContacts() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all customers with blank or placeholder phone numbers
  const blankCustomers = await Customer.find({
    $or: [
      { phone: { $regex: "^BLANK_" } },
      { phone: "" },
      { phone: null }
    ]
  });

  console.log(`\n=======================================================`);
  console.log(`FOUND ${blankCustomers.length} TOTAL BLANK-PHONE CONTACTS ACROSS ALL CATEGORIES`);
  console.log(`=======================================================`);

  const auditList = [];

  for (const c of blankCustomers) {
    // Clean name
    const cleanName = c.name.replace(/\s*\(No Phone Number\)\s*/i, "").trim();
    c.name = cleanName;

    // Ensure unique BLANK_ phone identifier to prevent any key collisions
    if (!c.phone || c.phone === "" || !c.phone.startsWith("BLANK_")) {
      c.phone = `BLANK_${cleanName.replace(/\s+/g, "_")}_${c._id.toString().slice(-6)}`;
    }

    // Ensure tags contain category
    if (c.category && (!c.tags || !c.tags.includes(c.category))) {
      const mergedTags = new Set([...(c.tags || []), c.category]);
      c.tags = Array.from(mergedTags);
    }

    await c.save();

    auditList.push({
      Name: c.name,
      Category: c.category,
      Tags: JSON.stringify(c.tags),
      PhoneKey: c.phone
    });
  }

  console.table(auditList);

  // Group by category summary
  const categories = ["AURA", "GOLD", "DREAMLAND", "ADITYA ST SOCIETY", "ELEGANCE", "SKYLINE", "LUXURIA", "ICON", "SHREEJI"];
  console.log(`\n=======================================================`);
  console.log(`BLANK-PHONE CONTACTS COUNT BY CATEGORY:`);
  console.log(`=======================================================`);

  for (const cat of categories) {
    const count = await Customer.countDocuments({
      $or: [{ category: cat }, { tags: cat }],
      phone: { $regex: "^BLANK_" }
    });
    console.log(`Category [${cat}]: ${count} Blank Phone Contact(s)`);
  }

  process.exit(0);
}

checkAndFixAllBlankContacts();
