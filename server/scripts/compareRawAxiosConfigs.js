import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  
  let configs = [];
  
  const interceptor = axios.interceptors.request.use((config) => {
    configs.push({
      url: config.url,
      method: config.method,
      headers: { ...config.headers },
      data: config.data
    });
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Compare Configs"
    },
    admin: { role: "superadmin", _id: new mongoose.Types.ObjectId() }
  };
  const res = {
    status(code) { return this; },
    json(data) { return this; }
  };
  
  await sendCrmBroadcast(req, res, () => {});
  if (req.campaignPromise) {
    try { await req.campaignPromise; } catch (e) {}
  }
  
  try {
    await sendTextMessage("918780150610", "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?");
  } catch (e) {}
  
  axios.interceptors.request.eject(interceptor);
  
  console.log("-----------------------------------------");
  console.log("Config 1 (Controller):", JSON.stringify(configs[0], null, 2));
  console.log("Config 2 (Direct):", JSON.stringify(configs[1], null, 2));
  
  await mongoose.connection.close();
};

run();
