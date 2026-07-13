import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import ContactInquiry from "../models/ContactInquiry.js";
import CallbackRequest from "../models/CallbackRequest.js";

const run = async () => {
  await connectDB();
  const crmCount = await Customer.countDocuments();
  const inqCount = await ContactInquiry.countDocuments();
  const cbCount = await CallbackRequest.countDocuments();
  console.log(`Audience counts in DB:`);
  console.log(`- WhatsApp CRM Customers: ${crmCount}`);
  console.log(`- Contact Inquiries: ${inqCount}`);
  console.log(`- Callback Requests: ${cbCount}`);
  await mongoose.connection.close();
};
run();
