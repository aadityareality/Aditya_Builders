import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import ContactInquiry from "../models/ContactInquiry.js";
import CallbackRequest from "../models/CallbackRequest.js";

const run = async () => {
  await connectDB();
  
  const inqs = await ContactInquiry.find({ name: /KRISHNA/i });
  console.log("Matching Inquiries:", inqs.length);
  for (const c of inqs) {
    console.log(`- ID: ${c._id}, Name: '${c.name.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}', Phone: '${c.phone}'`);
  }
  
  const cbs = await CallbackRequest.find({ name: /KRISHNA/i });
  console.log("Matching Callbacks:", cbs.length);
  for (const c of cbs) {
    console.log(`- ID: ${c._id}, Name: '${c.name.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}', Phone: '${c.phone}'`);
  }
  
  await mongoose.connection.close();
};

run();
