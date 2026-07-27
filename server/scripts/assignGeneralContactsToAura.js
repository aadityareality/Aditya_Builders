import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function assignGeneralContacts() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all customers currently categorized as 'General' or blank
  const generalCustomers = await Customer.find({
    $or: [{ category: "General" }, { category: { $exists: false } }, { category: "" }]
  });

  console.log(`Found ${generalCustomers.length} contacts in General category.`);

  for (const c of generalCustomers) {
    c.category = "AURA";
    if (!c.tags) c.tags = [];
    if (!c.tags.includes("AURA")) c.tags.push("AURA");
    await c.save();
    console.log(`✅ Assigned ${c.name} (${c.phone}) -> Category: AURA`);
  }

  const generalRemaining = await Customer.countDocuments({ category: "General" });
  console.log(`\nRemaining General contacts: ${generalRemaining}`);

  process.exit(0);
}

assignGeneralContacts();
