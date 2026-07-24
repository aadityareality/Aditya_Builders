import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";

const run = async () => {
  await connectDB();
  const list = await Customer.find({ name: /KRISHNA/i });
  console.log("Matching customers:", list.length);
  for (const c of list) {
    console.log(`- ID: ${c._id}, Name: '${c.name.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}', Phone: '${c.phone}'`);
  }
  await mongoose.connection.close();
};

run();
