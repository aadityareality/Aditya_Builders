import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  
  let payload1 = null;
  let payload2 = null;
  
  // Set up interceptor to capture payload data
  const interceptor = axios.interceptors.request.use((config) => {
    if (!payload1) {
      payload1 = config.data;
    } else {
      payload2 = config.data;
    }
    return config;
  });
  
  // Flow 1: Controller broadcast
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Compare Test"
    },
    admin: { role: "superadmin", _id: new mongoose.Types.ObjectId() }
  };
  const res = {
    status(code) { return this; },
    json(data) { return this; }
  };
  
  console.log("Running Controller Flow...");
  await sendCrmBroadcast(req, res, () => {});
  if (req.campaignPromise) {
    try { await req.campaignPromise; } catch (e) {}
  }
  
  // Flow 2: Direct service call
  console.log("Running Direct Flow...");
  try {
    await sendTextMessage("918780150610", "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?");
  } catch (e) {}
  
  axios.interceptors.request.eject(interceptor);
  
  console.log("-----------------------------------------");
  console.log("Payload 1 (Controller) type:", typeof payload1);
  console.log("Payload 2 (Direct) type:", typeof payload2);
  
  const p1Str = typeof payload1 === "string" ? payload1 : JSON.stringify(payload1);
  const p2Str = typeof payload2 === "string" ? payload2 : JSON.stringify(payload2);
  
  console.log("Payload 1 Length:", p1Str.length);
  console.log("Payload 2 Length:", p2Str.length);
  console.log("Strings match?", p1Str === p2Str);
  
  if (p1Str !== p2Str) {
    console.log("Analyzing difference...");
    const minLen = Math.min(p1Str.length, p2Str.length);
    for (let i = 0; i < minLen; i++) {
      if (p1Str[i] !== p2Str[i]) {
        console.log(`Diff at char ${i}:`);
        console.log(`Payload 1: ${p1Str[i]} (code: ${p1Str.charCodeAt(i)})`);
        console.log(`Payload 2: ${p2Str[i]} (code: ${p2Str.charCodeAt(i)})`);
        break;
      }
    }
  }
  
  await mongoose.connection.close();
};

run();
