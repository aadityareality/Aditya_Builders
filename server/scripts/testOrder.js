import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  
  axios.interceptors.request.use((config) => {
    console.log("Interceptor data type:", typeof config.data, "isBuffer?", Buffer.isBuffer(config.data));
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Test Order"
    },
    admin: { role: "superadmin", _id: new mongoose.Types.ObjectId() }
  };
  const res = {
    status(code) { return this; },
    json(data) { return this; }
  };
  
  console.log("--- Running Direct Flow ---");
  try {
    const res = await sendTextMessage("918780150610", "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?");
    console.log("Direct Flow success!");
  } catch (e) {
    console.log("Direct Flow error caught:", e.message);
  }
  
  console.log("--- Running Controller Flow ---");
  await sendCrmBroadcast(req, res, () => {});
  if (req.campaignPromise) {
    try { await req.campaignPromise; } catch (e) {
      console.log("Controller Flow Promise error caught:", e.message);
    }
  }
  
  await mongoose.connection.close();
};

run();
