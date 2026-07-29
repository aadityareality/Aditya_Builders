import "dotenv/config";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";

async function cleanUpRescheduled() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const res = await Appointment.updateMany(
    { status: "Rescheduled" },
    { $set: { status: "Confirmed" } }
  );

  console.log(`✅ Updated ${res.modifiedCount} old Rescheduled appointment records to Confirmed!`);
  process.exit(0);
}

cleanUpRescheduled();
