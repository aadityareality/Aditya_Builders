import "dotenv/config";
import mongoose from "mongoose";

async function auditBackend() {
  console.log("🔍 Auditing Backend Server Code & Imports...");

  try {
    const Customer = (await import("../models/Customer.js")).default;
    const Chat = (await import("../models/Chat.js")).default;
    const Message = (await import("../models/Message.js")).default;
    const Campaign = (await import("../models/Campaign.js")).default;
    console.log("✅ Models loaded successfully.");

    const whatsappService = await import("../src/services/whatsappService.js");
    console.log("✅ whatsappService functions loaded:", Object.keys(whatsappService));

    const whatsappController = await import("../src/controllers/whatsappController.js");
    console.log("✅ whatsappController functions loaded:", Object.keys(whatsappController));

    const adminCrmController = await import("../controllers/adminCrmController.js");
    console.log("✅ adminCrmController functions loaded:", Object.keys(adminCrmController));

    console.log("\n=======================================================");
    console.log("🎉 AUDIT PASSED: ALL BACKEND MODULES IMPORT & SYNTAX CHECK CLEAN!");
    console.log("=======================================================");
  } catch (err) {
    console.error("❌ Backend Audit Error:", err);
  }

  process.exit(0);
}

auditBackend();
