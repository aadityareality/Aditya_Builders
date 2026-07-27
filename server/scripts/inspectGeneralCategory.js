import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function inspectGeneralCategory() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const generalCustomers = await Customer.find({
    $or: [{ category: "General" }, { category: { $exists: false } }, { category: "" }]
  });

  console.log(`\nFound ${generalCustomers.length} contacts in General Category:\n`);
  generalCustomers.forEach((c, index) => {
    console.log(`${index + 1}. Name: "${c.name}", Phone: "${c.phone}", Source: "${c.source || 'N/A'}", Notes: "${c.notes || ''}", Created: ${c.createdAt}`);
  });

  process.exit(0);
}

inspectGeneralCategory();
