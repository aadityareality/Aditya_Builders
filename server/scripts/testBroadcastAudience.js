import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { getBroadcastAudience } from "../controllers/adminCrmController.js";

const run = async () => {
  await connectDB();

  // Wait until connection is fully established
  while (mongoose.connection.readyState !== 1) {
    console.log("Waiting for database connection...");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log("Database connection readyState:", mongoose.connection.readyState);

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

  console.log("📋 Fetching unified audience list...");
  try {
    await getBroadcastAudience(req, res, (err) => {
      if (err) console.error("Error passed to next():", err);
    });
  } catch (err) {
    console.error("Caught error:", err);
  }

  console.log("Response Code:", res.statusCode);
  console.log("Audience size returned:", res.jsonData?.data?.length);
  if (res.jsonData?.data?.length > 0) {
    console.log("First Audience Entry:", res.jsonData.data[0]);
  }

  if (res.statusCode === 200 && res.jsonData && res.jsonData.success) {
    console.log("✅ getBroadcastAudience validation passed!");
  } else {
    console.error("❌ getBroadcastAudience validation failed!");
  }

  await mongoose.connection.close();
};

run();
