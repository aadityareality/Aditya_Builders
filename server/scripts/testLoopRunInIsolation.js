import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Campaign from "../models/Campaign.js";
import ContactInquiry from "../models/ContactInquiry.js";
import CallbackRequest from "../models/CallbackRequest.js";

const run = async () => {
  await connectDB();
  
  const customerId = "6a630ff0f7d6f885373838ab";
  const campaign = await Campaign.create({
    name: "Isolation Test",
    messageType: "text",
    body: "hello",
    sentBy: new mongoose.Types.ObjectId()
  });

  let successCount = 0;
  let failureCount = 0;
  const errors = [];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const customerIds = [customerId];

  console.log("🚀 Starting Loop...");
  for (let i = 0; i < customerIds.length; i++) {
    const customerId = customerIds[i];

    try {
      let customer = await Customer.findById(customerId);
      if (!customer) {
        const tempInq = await ContactInquiry.findById(customerId);
        const tempCb = tempInq ? null : await CallbackRequest.findById(customerId);
        const leadName = tempInq?.name || tempCb?.name || "Customer Lead";
        const leadPhone = tempInq?.phone || tempCb?.phone;
        const projId = tempInq?.project || tempCb?.project || null;
        
        if (leadPhone) {
          customer = await Customer.create({
            phone: leadPhone.replace(/[^0-9]/g, ""),
            name: leadName,
            source: tempInq ? "Website Inquiry" : "Callback Request",
            leadStatus: "New",
            interestedProject: projId
          });
        }
      }

      console.log("1. Checking !customer, value:", customer);
      if (!customer) {
        console.log("2. Customer is null, running campaign update and continue...");
        failureCount++;
        errors.push(`Customer ${customerId} not found`);
        await Campaign.findByIdAndUpdate(campaign._id, { successCount, failureCount });
        console.log("3. About to execute continue...");
        continue;
      }

      console.log("4. Reading phone...");
      const phone = customer.phone;
      console.log("5. Phone is:", phone);
    } catch (err) {
      console.error("❌ Loop error caught:", err.stack);
    }
  }

  console.log("🏁 Loop Finished!");
  await Campaign.findByIdAndDelete(campaign._id);
  await mongoose.connection.close();
};

run();
