import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import ContactInquiry from "../models/ContactInquiry.js";
import CallbackRequest from "../models/CallbackRequest.js";
import Project from "../models/Project.js";

const run = async () => {
  try {
    console.log("⚡ Starting Direct Query Tests...");
    await connectDB();

    console.log("📋 Querying Customer...");
    const custs = await Customer.find().populate("interestedProject").lean();
    console.log("✅ Customers count:", custs.length);

    console.log("📋 Querying ContactInquiry...");
    const inqs = await ContactInquiry.find().populate("interestedProject").lean();
    console.log("✅ Inquiries count:", inqs.length);

    console.log("📋 Querying CallbackRequest...");
    const calls = await CallbackRequest.find().populate("relatedProject").lean();
    console.log("✅ Callbacks count:", calls.length);

    await mongoose.connection.close();
    console.log("🎉 Direct query tests finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Direct Query Test failed:", err);
    process.exit(1);
  }
};

run();
