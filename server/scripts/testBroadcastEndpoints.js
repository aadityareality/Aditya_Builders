import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { getBroadcastAudience, getCampaignHistory } from "../controllers/adminCrmController.js";
import Admin from "../models/Admin.js";
import Project from "../models/Project.js";

const run = async () => {
  try {
    console.log("⚡ Starting Endpoints Tests...");
    await connectDB();

    const req = {
      admin: {
        role: "superadmin"
      }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };

    console.log("📋 Fetching Audience...");
    await getBroadcastAudience(req, res, (err) => {
      if (err) throw err;
    });
    console.log("Audience Code:", res.statusCode);
    console.log("Audience Length:", res.jsonData?.data?.length);

    console.log("📋 Fetching Campaigns...");
    await getCampaignHistory(req, res, (err) => {
      if (err) throw err;
    });
    console.log("Campaigns Code:", res.statusCode);
    console.log("Campaigns Length:", res.jsonData?.data?.length);

    await mongoose.connection.close();
    console.log("🎉 All endpoints checked successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
};

run();
