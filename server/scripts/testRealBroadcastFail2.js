import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";

const run = async () => {
  await connectDB();
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Test Diagnostic Fail 2"
    },
    admin: { role: "superadmin", _id: new mongoose.Types.ObjectId() }
  };
  
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };
  
  await sendCrmBroadcast(req, res, () => {});
  
  if (req.campaignPromise) {
    console.log("Awaiting campaign loop processing...");
    try {
      await req.campaignPromise;
    } catch (err) {
      console.error("❌ Promise catch:", err.message);
    }
  }
  
  await mongoose.connection.close();
};

run();
