import mongoose from "mongoose";
import dotenv from "dotenv";
import ContactInquiry from "../models/ContactInquiry.js";
import WebhookLog from "../models/WebhookLog.js";

dotenv.config();

async function runDiagnostics() {
  const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/aditya-builders";
  console.log("Connecting to Database:", dbUri.split("@")[1] || dbUri);
  
  try {
    await mongoose.connect(dbUri);
    console.log("✅ Connected successfully.\n");
    
    console.log("--- LATEST 5 INQUIRIES ---");
    const inquiries = await ContactInquiry.find()
      .sort({ createdAt: -1 })
      .limit(5);
      
    if (inquiries.length === 0) {
      console.log("No inquiries found in database.");
    } else {
      inquiries.forEach((inq, index) => {
        console.log(`[${index + 1}] Date: ${inq.createdAt.toLocaleString("en-IN")}`);
        console.log(`    Name: ${inq.name}`);
        console.log(`    Phone: ${inq.phone}`);
        console.log(`    WA Message Status: ${inq.whatsappCustomerMessageStatus}`);
        console.log(`    WA Admin Notified: ${inq.whatsappAdminNotified}`);
        console.log(`    WA Message ID: ${inq.whatsappCustomerMessageId || "None"}`);
        console.log("--------------------------------------");
      });
    }
    
    console.log("\n--- LATEST 5 WEBHOOK / ERROR LOGS ---");
    const logs = await WebhookLog.find()
      .sort({ createdAt: -1 })
      .limit(5);
      
    if (logs.length === 0) {
      console.log("No webhook logs found in database.");
    } else {
      logs.forEach((log, index) => {
        console.log(`[${index + 1}] Date: ${log.createdAt.toLocaleString("en-IN")}`);
        console.log(`    Event Type: ${log.eventType}`);
        console.log(`    Processed: ${log.processed}`);
        console.log(`    Error Logged: ${log.error || "None"}`);
        console.log("--------------------------------------");
      });
    }
    
  } catch (err) {
    console.error("Database connection failure:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDiagnostics run finished.");
  }
}

runDiagnostics();
