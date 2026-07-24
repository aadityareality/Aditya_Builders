import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Campaign from "../models/Campaign.js";

const run = async () => {
  await connectDB();
  const logs = await Campaign.find().sort({ createdAt: -1 }).limit(1).lean();
  console.log("📢 Latest Campaign Log:");
  console.log(JSON.stringify(logs, null, 2));
  await mongoose.connection.close();
};

run();
