import "dotenv/config";
import { sendCrmBroadcast } from "../controllers/adminCrmController.js";

const run = async () => {
  const req = {
    body: {
      customerIds: ["6a630ff0f7d6f885373838ab"],
      messageType: "text",
      body: "kem cho?\nmaja ma?",
      campaignName: "Test Mock Db Campaign"
    },
    admin: { role: "superadmin", _id: "6a5705cddfee96a7fcecec3e" }
  };
  
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };
  
  console.log("🚀 Running broadcast with Mock DB...");
  await sendCrmBroadcast(req, res, () => {});
  
  if (req.campaignPromise) {
    try {
      await req.campaignPromise;
    } catch (err) {
      console.error("❌ Promise failed:", err.message);
    }
  }
};

run();
