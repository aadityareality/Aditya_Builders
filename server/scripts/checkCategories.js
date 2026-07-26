import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function checkCategories() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const categories = await Customer.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  console.log("📊 DB CATEGORY BREAKDOWN:");
  console.table(categories);
  const total = await Customer.countDocuments({});
  console.log("TOTAL CONTACTS IN DB:", total);
  process.exit(0);
}

checkCategories();
