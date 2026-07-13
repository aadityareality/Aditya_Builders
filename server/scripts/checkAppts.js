import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Appointment from "../models/Appointment.js";

const run = async () => {
  await connectDB();
  const list = await Appointment.find({ customerPhone: "918780150610" });
  console.log("Appointments found:", list.map(a => ({
    id: a._id,
    customerPhone: a.customerPhone,
    project: a.project,
    preferredDate: a.preferredDate?.toISOString(),
    preferredTime: a.preferredTime,
    status: a.status
  })));
  await mongoose.connection.close();
};
run();
