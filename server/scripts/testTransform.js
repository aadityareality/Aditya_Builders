import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  console.log("Startup: axios.defaults.transformRequest is:", axios.defaults.transformRequest);
  
  await connectDB();
  
  axios.interceptors.request.use((config) => {
    console.log("Interceptor: config.transformRequest for", config.url, "is:", config.transformRequest);
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Test Transform"
    },
    admin: { role: "superadmin", _id: new mongoose.Types.ObjectId() }
  };
  const res = {
    status(code) { return this; },
    json(data) { return this; }
  };
  
  console.log("--- Running Controller Flow ---");
  try {
    await sendCrmBroadcast(req, res, () => {});
    if (req.campaignPromise) {
      await req.campaignPromise;
    }
  } catch (e) {}
  
  console.log("--- Running Direct Flow ---");
  try {
    await sendTextMessage("918780150610", "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?");
  } catch (e) {}
  
  console.log("End: axios.defaults.transformRequest is:", axios.defaults.transformRequest);
  await mongoose.connection.close();
};

run();
