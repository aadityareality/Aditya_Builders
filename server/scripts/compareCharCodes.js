import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import axios from "axios";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  await connectDB();
  
  let text1 = "";
  let text2 = "";
  
  const interceptor = axios.interceptors.request.use((config) => {
    const dataObj = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    const textParam = dataObj?.template?.components?.[0]?.parameters?.[0]?.text;
    if (!text1) {
      text1 = textParam;
    } else {
      text2 = textParam;
    }
    return config;
  });
  
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Compare Codes"
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
  console.log("Text 1 (Controller) length:", text1?.length);
  console.log("Text 2 (Direct) length:", text2?.length);
  
  if (text1) {
    console.log("Text 1 charcodes:");
    for (let i = 0; i < text1.length; i++) {
      console.log(`- ${i}: '${text1[i]}' (code: ${text1.charCodeAt(i)})`);
    }
  }
  
  if (text2) {
    console.log("Text 2 charcodes:");
    for (let i = 0; i < text2.length; i++) {
      console.log(`- ${i}: '${text2[i]}' (code: ${text2.charCodeAt(i)})`);
    }
  }
  
  await mongoose.connection.close();
};

run();
