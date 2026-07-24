import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";

const run = async () => {
  await connectDB();
  
  const customers = await Customer.find({});
  console.log(`Checking ${customers.length} customers...`);
  
  let updatedCount = 0;
  for (const c of customers) {
    if (c.name) {
      const trimmed = c.name.trim();
      if (trimmed !== c.name) {
        console.log(`Sanitizing name for customer ${c._id}: '${c.name.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}' -> '${trimmed}'`);
        c.name = trimmed;
        await c.save();
        updatedCount++;
      }
    }
  }
  
  console.log(`🏁 Done! Sanitized ${updatedCount} customer names.`);
  await mongoose.connection.close();
};

run();
