import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";

const run = async () => {
  await connectDB();
  const customer = await Customer.findOne({ name: /JAY SHREE/ });
  if (customer) {
    console.log("Customer found:", customer.name);
    console.log("Char Codes:");
    for (let i = 0; i < customer.name.length; i++) {
      console.log(`Char at ${i}: ${customer.name[i]} (code: ${customer.name.charCodeAt(i)})`);
    }
  } else {
    console.log("Customer not found!");
  }
  await mongoose.connection.close();
};

run();
