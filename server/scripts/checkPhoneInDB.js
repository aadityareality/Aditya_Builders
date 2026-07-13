import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";

const run = async () => {
  await connectDB();
  const list = await Customer.find({ phone: /8780150610/ });
  console.log("Matching customers:", list.map(c => ({ id: c._id, name: c.name, phone: c.phone, source: c.source })));
  await mongoose.connection.close();
};
run();
