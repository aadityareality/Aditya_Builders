import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { checkActiveSession } from "../src/services/whatsappService.js";
import Customer from "../models/Customer.js";

async function testSession() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const phones = [
    "919913863602", // Yash
    "918780221148", // Bhatu
    "918780150610", // Yakshit
    "917285077405", // Gopi
    "8799008221",   // Priya
    "919875025100", // Mayani
    "919327979138"  // Prashant
  ];

  for (const p of phones) {
    const isActive = await checkActiveSession(p);
    console.log(`Phone: ${p} | Active 24-hr Session: ${isActive}`);
  }

  process.exit(0);
}

testSession();
