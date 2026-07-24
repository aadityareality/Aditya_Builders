import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";

const run = async () => {
  await connectDB();
  
  // Set up axios interceptor to print raw request details
  axios.interceptors.request.use((config) => {
    console.log("🚀 RAW AXIOS REQUEST CONFIG:");
    console.log("URL:", config.url);
    console.log("Method:", config.method);
    console.log("Headers:", JSON.stringify(config.headers, null, 2));
    console.log("Data:", JSON.stringify(config.data, null, 2));
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Test Raw Interceptor"
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
    await req.campaignPromise;
  }
  
  await mongoose.connection.close();
};

run();
