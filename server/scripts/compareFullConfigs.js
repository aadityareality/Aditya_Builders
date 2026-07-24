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
    configs.push(config);
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Compare Full Configs"
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
  } catch (e) {
    console.log("Controller Flow threw error:", e.message);
  }
  
  console.log("--- Running Direct Flow ---");
  try {
    await sendTextMessage("918780150610", "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?");
  } catch (e) {
    console.log("Direct Flow threw error:", e.message);
  }
  
  axios.interceptors.request.eject(interceptor);
  
  console.log("-----------------------------------------");
  console.log("Configs captured:", configs.length);
  if (configs.length >= 2) {
    const c1 = configs[0];
    const c2 = configs[1];
    
    // Compare keys
    const keys1 = Object.keys(c1).sort();
    const keys2 = Object.keys(c2).sort();
    console.log("Keys in Config 1:", keys1.join(", "));
    console.log("Keys in Config 2:", keys2.join(", "));
    
    // Compare headers keys
    const hKeys1 = Object.keys(c1.headers).sort();
    const hKeys2 = Object.keys(c2.headers).sort();
    console.log("Header Keys in Config 1:", hKeys1.join(", "));
    console.log("Header Keys in Config 2:", hKeys2.join(", "));
    
    // Check for any specific differences
    for (const key of keys1) {
      if (typeof c1[key] !== "function" && key !== "headers" && key !== "data" && key !== "transitional") {
        if (JSON.stringify(c1[key]) !== JSON.stringify(c2[key])) {
          console.log(`Difference in key '${key}':`);
          console.log(`Config 1:`, c1[key]);
          console.log(`Config 2:`, c2[key]);
        }
      }
    }
  }
  
  await mongoose.connection.close();
};

run();
