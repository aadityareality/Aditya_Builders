import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { getAvailableSlots, bookAppointmentViaAi } from "../src/services/aiAppointmentService.js";
import Project from "../models/Project.js";
import Customer from "../models/Customer.js";
import Appointment from "../models/Appointment.js";

const runTest = async () => {
  try {
    console.log("⚡ Starting Group B Verification Tests...");
    await connectDB();

    // 1. Retrieve an active project
    const project = await Project.findOne({ isActive: true });
    if (!project) {
      console.error("❌ No project found in the database. Please run npm run seed first.");
      process.exit(1);
    }
    
    console.log("🏢 Target Project resolved:", project.title);

    // 2. Query open slots for a specific date
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 5); // 5 days from now
    const dateStr = testDate.toISOString().split("T")[0];
    
    console.log(`\n📅 Checking open slots for project "${project.title}" on date ${dateStr}...`);
    
    // Clear existing appointments on this date to ensure test reliability
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);
    await Appointment.deleteMany({
      project: project._id,
      preferredDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const slotsBefore = await getAvailableSlots(project._id, dateStr);
    console.log("   Available Slots:", slotsBefore);

    if (slotsBefore.length === 0) {
      console.error("❌ No available slots found. Clear database appointments for testDate.");
      process.exit(1);
    }

    // 3. Simulating first booking request
    let customer = await Customer.findOne({ phone: "919974858500" });
    if (!customer) {
      customer = await Customer.create({
        name: "Test Customer",
        phone: "919974858500",
        source: "WhatsApp"
      });
    }

    const chosenSlot = slotsBefore[0];
    console.log(`\n🎟️ Attempting booking for "${customer.name}" at ${chosenSlot}...`);
    const bookingResult = await bookAppointmentViaAi(
      customer,
      project.title,
      dateStr,
      chosenSlot
    );
    console.log("   Result:", bookingResult.message);

    if (!bookingResult.success) {
      console.error("❌ AI Booking Failed:", bookingResult.message);
      process.exit(1);
    }

    // 4. Verify slot is now marked as busy
    const slotsAfter = await getAvailableSlots(project._id, dateStr);
    console.log(`\n📅 Re-checking slots after booking:`, slotsAfter);
    if (slotsAfter.includes(chosenSlot)) {
      console.error(`❌ Error: Slot "${chosenSlot}" should have been booked and removed from available list.`);
      process.exit(1);
    }
    console.log(`✅ Success: Slot "${chosenSlot}" is now successfully reserved.`);

    // 5. Test Double-Booking Block
    console.log("\n🛡️ Testing double-booking block (attempting same slot again)...");
    const duplicateResult = await bookAppointmentViaAi(
      customer,
      project.title,
      dateStr,
      chosenSlot
    );
    console.log("   Duplicate Booking Attempt Response:", duplicateResult.message);
    
    if (duplicateResult.success) {
      console.error("❌ Error: Double booking was allowed! Database constraints failed.");
      process.exit(1);
    } else {
      console.log("✅ Success: Double booking was blocked successfully.");
    }

    console.log("\n✅ GROUP B VERIFICATION RUN COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Group B test script crashed:", err);
    process.exit(1);
  }
};

runTest();
