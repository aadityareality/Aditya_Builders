import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Campaign from "../models/Campaign.js";

const wabaId = "2269311140508044";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Check all template statuses
  console.log("=== TEMPLATE STATUSES ===");
  try {
    const res = await axios.get(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`, { headers });
    for (const t of res.data.data) {
      console.log(`${t.name}: ${t.status}`);
    }
  } catch (err) {
    console.error("Template fetch error:", err.response?.data || err.message);
  }

  // 2. Check latest campaign error
  console.log("\n=== LATEST CAMPAIGN LOG ===");
  await connectDB();
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(1).lean();
  if (campaigns.length > 0) {
    const c = campaigns[0];
    console.log("Campaign:", c.name);
    console.log("Status:", c.status);
    console.log("Dispatch Log:");
    if (c.dispatchLog) {
      for (const entry of (c.dispatchLog || []).slice(0, 5)) {
        console.log(` - ${entry.customerName || entry.phone}: ${entry.status} | ${entry.error || "ok"}`);
      }
    }
  }
  await mongoose.connection.close();
};

run();
