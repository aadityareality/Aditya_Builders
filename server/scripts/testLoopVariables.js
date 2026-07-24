import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import ContactInquiry from "../models/ContactInquiry.js";
import CallbackRequest from "../models/CallbackRequest.js";

const run = async () => {
  await connectDB();
  
  const customerId = "6a630ff0f7d6f885373838ab";
  
  console.log("1. Finding in Customer...");
  let customer = await Customer.findById(customerId);
  console.log("- Result:", customer);
  
  if (!customer) {
    console.log("2. Customer not found. Finding lead...");
    const tempInq = await ContactInquiry.findById(customerId);
    console.log("- Inquiry found:", tempInq);
    const tempCb = tempInq ? null : await CallbackRequest.findById(customerId);
    console.log("- Callback found:", tempCb);
    
    const leadName = tempInq?.name || tempCb?.name || "Customer Lead";
    const leadPhone = tempInq?.phone || tempCb?.phone;
    const projId = tempInq?.project || tempCb?.project || null;
    
    console.log("- leadPhone:", leadPhone);
    if (leadPhone) {
      console.log("3. Creating Customer...");
      try {
        customer = await Customer.create({
          phone: leadPhone.replace(/[^0-9]/g, ""),
          name: leadName,
          source: tempInq ? "Website Inquiry" : "Callback Request",
          leadStatus: "New",
          interestedProject: projId
        });
        console.log("- Created Customer document:", customer);
      } catch (err) {
        console.error("- Customer.create error:", err.message);
      }
    }
  }
  
  console.log("4. Check: !customer");
  console.log("- customer value:", customer);
  console.log("- !customer evaluates to:", !customer);
  
  if (!customer) {
    console.log("- Entered !customer block, running continue simulation.");
  } else {
    console.log("5. Reading customer.phone...");
    console.log("- customer.phone is:", customer.phone);
  }
  
  await mongoose.connection.close();
};

run();
