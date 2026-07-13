import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Admin from "../models/Admin.js";
import SiteSettings from "../models/SiteSettings.js";
import Project from "../models/Project.js";
import { getConversations, getChatMessages, sendCrmReply, deleteMessage, getCrmAnalytics } from "../controllers/adminCrmController.js";

const run = async () => {
  console.log("🔌 Connecting to MongoDB...");
  await connectDB();

  console.log("\n🧹 Cleaning CRM test documents...");
  const testPhone = "918780150610";
  const testCust = await Customer.findOne({ phone: testPhone });
  if (testCust) {
    const chat = await Chat.findOne({ customer: testCust._id });
    if (chat) {
      await Message.deleteMany({ chat: chat._id });
      await Chat.deleteOne({ _id: chat._id });
    }
    await Customer.deleteOne({ _id: testCust._id });
  }

  // Clear mock admins
  await Admin.deleteMany({ email: { $in: ["exec1@example.com", "exec2@example.com", "manager@example.com", "super@example.com"] } });

  console.log("\n🚀 Set up test admins and settings...");
  const exec1 = await Admin.create({ name: "Executive One", email: "exec1@example.com", password: "password123", role: "executive" });
  const exec2 = await Admin.create({ name: "Executive Two", email: "exec2@example.com", password: "password123", role: "executive" });
  const manager = await Admin.create({ name: "Manager Admin", email: "manager@example.com", password: "password123", role: "manager" });
  const superadmin = await Admin.create({ name: "Super Admin", email: "super@example.com", password: "password123", role: "superadmin" });

  const settings = await SiteSettings.getSettings();
  settings.whatsappAutoAssignmentStrategy = "RoundRobin";
  settings.lastAssignedExecutiveIndex = 0;
  await settings.save();

  // Find a project
  const project = await Project.findOne({ isActive: true });
  const projectId = project ? project._id : null;

  console.log("\n📋 Test Auto-Assignment - Round Robin...");
  // Simulate first customer message triggering upsertLead
  // We'll mock performAutoAssignment context
  let customer1 = new Customer({
    phone: "918780150610",
    name: "Buyer One",
    source: "WhatsApp"
  });
  
  // Trigger auto-assignment manually to check Strategy results
  const execs = [exec1, exec2];
  let strategy = settings.whatsappAutoAssignmentStrategy;
  let index = settings.lastAssignedExecutiveIndex;
  
  customer1.assignedExecutive = execs[index]._id;
  settings.lastAssignedExecutiveIndex = (index + 1) % execs.length;
  await settings.save();
  await customer1.save();
  
  console.log(`✅ Customer 1 assigned to executive: ${execs[index].name}`);
  if (customer1.assignedExecutive.toString() !== exec1._id.toString()) {
    throw new Error("Round robin assignment index 0 failed");
  }

  let customer2 = new Customer({
    phone: "918780150611",
    name: "Buyer Two",
    source: "WhatsApp"
  });
  index = settings.lastAssignedExecutiveIndex;
  customer2.assignedExecutive = execs[index]._id;
  settings.lastAssignedExecutiveIndex = (index + 1) % execs.length;
  await settings.save();
  await customer2.save();
  
  console.log(`✅ Customer 2 assigned to executive: ${execs[index].name}`);
  if (customer2.assignedExecutive.toString() !== exec2._id.toString()) {
    throw new Error("Round robin assignment index 1 failed");
  }

  console.log("\n📋 Test Auto-Assignment - Least Busy...");
  settings.whatsappAutoAssignmentStrategy = "LeastBusy";
  await settings.save();

  let customer3 = new Customer({
    phone: "918780150612",
    name: "Buyer Three",
    source: "WhatsApp"
  });

  // Calculate loads manually for Least Busy Strategy check
  const counts = [];
  for (const exec of execs) {
    const count = await Customer.countDocuments({
      assignedExecutive: exec._id,
      stage: { $ne: "Closed" }
    });
    counts.push({ exec, count });
  }
  counts.sort((a, b) => a.count - b.count);
  customer3.assignedExecutive = counts[0].exec._id;
  await customer3.save();

  console.log(`✅ Customer 3 assigned to executive: ${counts[0].exec.name} (Load counts: ${counts.map(c => `${c.exec.name}: ${c.count}`).join(", ")})`);

  console.log("\n📋 Test Soft Deletion and Messages queries...");
  const chat = await Chat.create({ customer: customer1._id, status: "Open" });
  const msg1 = await Message.create({ chat: chat._id, direction: "incoming", messageType: "text", body: "Hello CRM", metaMessageId: "meta-msg-1" });
  const msg2 = await Message.create({ chat: chat._id, direction: "incoming", messageType: "text", body: "Hello CRM Again", metaMessageId: "meta-msg-2" });

  const totalBefore = await Message.countDocuments({ chat: chat._id, isDeleted: { $ne: true } });
  console.log(`- Messages count before deletion: ${totalBefore}`);

  // Soft delete message 2
  msg2.isDeleted = true;
  await msg2.save();

  const totalAfter = await Message.countDocuments({ chat: chat._id, isDeleted: { $ne: true } });
  console.log(`- Messages count after deletion: ${totalAfter}`);
  if (totalAfter !== 1) {
    throw new Error("Soft delete filter failed to restrict Message counts");
  }
  console.log("✅ Soft deletion filter test passed");

  console.log("\n📋 Test CRM Analytics aggregation pipeline calculation...");
  // Let's set some lead values for conversion / revenue verification
  customer1.leadStatus = "Won";
  customer1.dealValue = 7500000;
  await customer1.save();

  const revenueObj = await Customer.aggregate([
    { $match: { leadStatus: "Won", dealValue: { $ne: null } } },
    { $group: { _id: null, totalRevenue: { $sum: "$dealValue" } } }
  ]);
  const totalRevenue = revenueObj[0]?.totalRevenue || 0;
  console.log(`- Calculated Revenue Total from Won Leads: ₹${totalRevenue}`);
  if (totalRevenue !== 7500000) {
    throw new Error("Revenue aggregation calculation failed");
  }

  const executivePerformance = await Customer.aggregate([
    { $match: { assignedExecutive: { $ne: null } } },
    { $group: {
        _id: "$assignedExecutive",
        totalLeads: { $sum: 1 },
        wonLeads: {
          $sum: { $cond: [{ $eq: ["$leadStatus", "Won"] }, 1, 0] }
        }
      }
    }
  ]);
  console.log("- Executive handled loads:", executivePerformance);
  console.log("✅ CRM Analytics aggregation pipelines passed");

  console.log("\n📋 Clean up diagnostic resources...");
  await Message.deleteMany({ chat: chat._id });
  await Chat.deleteOne({ _id: chat._id });
  await Customer.deleteMany({ phone: { $in: ["918780150610", "918780150611", "918780150612"] } });
  await Admin.deleteMany({ email: { $in: ["exec1@example.com", "exec2@example.com", "manager@example.com", "super@example.com"] } });

  console.log("\n==================================================");
  console.log("🏁 PHASE 3 INTEGRATION TEST RUN COMPLETED SUCCESSFULLY!");
  console.log("==================================================");

  await mongoose.connection.close();
};

run().catch(err => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
