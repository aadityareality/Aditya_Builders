import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function masterVerifyAndClean() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // 1. Clean up any customer names with '(No Phone Number)' suffix
  const blankNameCustomers = await Customer.find({
    phone: { $regex: "^BLANK_" }
  });

  console.log(`\n=======================================================`);
  console.log(`1. CLEANING BLANK-PHONE CUSTOMER DISPLAY NAMES (${blankNameCustomers.length} Found)`);
  console.log(`=======================================================`);

  for (const c of blankNameCustomers) {
    const cleanName = c.name.replace(/\s*\(No Phone Number\)\s*/i, "").trim();
    if (c.name !== cleanName) {
      console.log(`✏️ Cleaned Name: "${c.name}" -> "${cleanName}"`);
      c.name = cleanName;
      await c.save();
    } else {
      console.log(`✓ Clean Name Verified: "${c.name}"`);
    }
  }

  // 2. Comprehensive Breakdown of All Project Categories in MongoDB
  const projects = [
    "AURA",
    "GOLD",
    "DREAMLAND",
    "ADITYA ST SOCIETY",
    "ELEGANCE",
    "SKYLINE",
    "LUXURIA",
    "ICON",
    "SHREEJI",
    "General"
  ];

  console.log(`\n=======================================================`);
  console.log(`2. MASTER FINAL AUDIT & BREAKDOWN ACROSS ALL PROJECTS`);
  console.log(`=======================================================`);

  const summary = [];
  for (const proj of projects) {
    const query = {
      $or: [{ category: proj }, { tags: proj }]
    };

    const allProjCustomers = await Customer.find(query);
    const validPhoneCount = allProjCustomers.filter(c => c.phone && !c.phone.startsWith("BLANK_")).length;
    const blankPhoneCount = allProjCustomers.filter(c => c.phone && c.phone.startsWith("BLANK_")).length;
    
    summary.push({
      Project: proj,
      TotalContacts: allProjCustomers.length,
      ValidPhoneNumbers: validPhoneCount,
      BlankPhoneNames: blankPhoneCount
    });
  }

  console.table(summary);

  const totalInDb = await Customer.countDocuments();
  console.log(`\nTOTAL UNIQUE CUSTOMERS IN DATABASE NOW: ${totalInDb}`);

  process.exit(0);
}

masterVerifyAndClean();
