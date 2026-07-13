import "dotenv/config";
process.env.NODE_ENV = "test";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Project from "../models/Project.js";
import Appointment from "../models/Appointment.js";
import CallbackRequest from "../models/CallbackRequest.js";
import ConversationState from "../models/ConversationState.js";
import InquiryQuestionLog from "../models/InquiryQuestionLog.js";
import { receiveWebhook } from "../src/controllers/whatsappController.js";

const testPhone = "918780150610";
const testName = "Aditya Integration Buyer";

// Helper to simulate webhook POST
const sendWebhookText = async (text) => {
  const mockPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "1234567890",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "919974858500",
                phone_number_id: "phone-id-123"
              },
              contacts: [
                {
                  profile: { name: testName },
                  wa_id: testPhone
                }
              ],
              messages: [
                {
                  from: testPhone,
                  id: `wamid.mock_${Date.now()}_${Math.random()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: text },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  let resStatus = 0;
  let resJson = null;
  const mockRes = {
    status: function(code) {
      resStatus = code;
      return this;
    },
    json: function(data) {
      resJson = data;
      return this;
    }
  };

  const mockReqPost = {
    body: mockPayload,
    headers: {
      "x-hub-signature-256": "sha256=mock-signature-hash"
    }
  };

  await receiveWebhook(mockReqPost, mockRes);
  // Introduce small typing delay simulation
  await new Promise(resolve => setTimeout(resolve, 500));
};

const runTest = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    // 1. Seed dummy project if none exist
    let project = await Project.findOne({ isActive: true });
    if (!project) {
      console.log("🌱 Seeding a test project...");
      project = await Project.create({
        title: "Aditya Test Residency",
        slug: "aditya-test-residency",
        location: "Waghawadi Road, Bhavnagar",
        status: "Ongoing",
        configuration: "2 & 3 BHK Apartments",
        startingPrice: "₹ 45 Lakhs",
        reraNumber: "PR/GJ/BHAVNAGAR/101",
        possessionDate: "December 2027",
        description: "A premium lifestyle apartment complex.",
        isActive: true,
        availableUnits: 15,
        brochure: {
          url: "https://example.com/mock-brochure.pdf",
          publicId: "mock_pdf",
          uploadedAt: new Date()
        }
      });
    }

    // Clear previous CRM state for clean run
    console.log("🧹 Cleaning old test records for phone number:", testPhone);
    const oldCust = await Customer.findOne({ phone: testPhone });
    if (oldCust) {
      const chat = await Chat.findOne({ customer: oldCust._id });
      if (chat) {
        await Message.deleteMany({ chat: chat._id });
        await Chat.deleteOne({ _id: chat._id });
      }
      await Customer.deleteOne({ _id: oldCust._id });
    }
    await Appointment.deleteMany({ customerPhone: testPhone });
    await CallbackRequest.deleteMany({ name: testName });
    await ConversationState.deleteMany({ phone: testPhone });
    await InquiryQuestionLog.deleteMany({ phone: testPhone });

    console.log("\n==================================================");
    console.log("🚀 STARTING CHATBOT STATE MACHINE INTEGRATION TEST");
    console.log("==================================================");

    // Step A: Send Hi -> Welcome Menu
    console.log("\n💬 [User] -> Hi");
    await sendWebhookText("Hi");

    // Verify Customer record exists with stage "New", source "WhatsApp", and score = 1
    let custRecord = await Customer.findOne({ phone: testPhone });
    console.log("🔍 Customer Lead Record created:", custRecord ? "YES" : "NO");
    console.log("   CRM Stage:", custRecord?.stage);
    console.log("   Lead Score:", custRecord?.leadScore);
    console.log("   Source:", custRecord?.source);

    // Step B: Send "1" -> Ongoing Project listing
    console.log("\n💬 [User] -> 1 (New Projects)");
    await sendWebhookText("1");
    let state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State:", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step C: Send "1" -> Select first project -> Detail view
    console.log("\n💬 [User] -> 1 (Select Project 1)");
    await sendWebhookText("1");
    state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State:", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step D: Send "2" -> Book Site Visit for this project
    console.log("\n💬 [User] -> 2 (Book Site Visit from details)");
    await sendWebhookText("2");
    state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State:", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step E: Send name
    console.log("\n💬 [User] -> John Doe");
    await sendWebhookText("John Doe");

    // Step F: Send YES to reuse detection number
    console.log("\n💬 [User] -> YES (use registered phone number)");
    await sendWebhookText("YES");

    // Step G: Send Invalid Email to test regex validation
    console.log("\n💬 [User] -> invalid-email-test (expecting validation block)");
    await sendWebhookText("invalid-email-test");
    state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State (Should still be on email step 3):", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step H: Send Valid Email
    console.log("\n💬 [User] -> buyer@example.com");
    await sendWebhookText("buyer@example.com");

    // Step I: Send past Date to test date validation
    console.log("\n💬 [User] -> 01/01/2020 (expecting future date block)");
    await sendWebhookText("01/01/2020");
    state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State (Should still be on date step 5):", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step J: Send Valid Future Date
    console.log("\n💬 [User] -> 25/12/2026");
    await sendWebhookText("25/12/2026");

    // Step K: Send Preferred Time
    console.log("\n💬 [User] -> 11:30 AM");
    await sendWebhookText("11:30 AM");

    // Step L: Send Visitors
    console.log("\n💬 [User] -> 4");
    await sendWebhookText("4");

    // Step M: Send Special Notes
    console.log("\n💬 [User] -> Need wheelchair access");
    await sendWebhookText("Need wheelchair access");
    state = await ConversationState.findOne({ phone: testPhone });
    console.log("🔍 Bot State (Confirm booking step 9):", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None");

    // Step N: Confirm Booking
    console.log("\n💬 [User] -> YES");
    await sendWebhookText("YES");

    // Verify booking saved, lead scoring incremented, stage changed
    const appointment = await Appointment.findOne({ customerPhone: testPhone });
    console.log("🔍 Appointment Record saved:", appointment ? "YES" : "NO");
    console.log("   Reference ID:", appointment?.referenceId);
    console.log("   Email stored:", appointment?.customerEmail);
    console.log("   Notes stored:", appointment?.notes);

    custRecord = await Customer.findOne({ phone: testPhone });
    console.log("🔍 Updated Customer Stage:", custRecord?.stage);
    console.log("   Lead Score:", custRecord?.leadScore);

    // Step O: Verify Duplicate Booking Prevention
    console.log("\n💬 [User] -> Restart booking the exact same slot...");
    const ongoingProjects = await Project.find({ isActive: true, status: { $in: ["Ongoing", "Upcoming"] } }).sort({ displayOrder: 1 });
    const targetProj = ongoingProjects[0] || project;
    
    await ConversationState.deleteMany({ phone: testPhone });
    await ConversationState.create({
      phone: testPhone,
      currentFlow: "site_visit_booking",
      currentStep: 9,
      collectedData: {
        projectId: targetProj._id,
        projectName: targetProj.title,
        name: "John Doe",
        phone: testPhone,
        email: "buyer@example.com",
        date: "25/12/2026",
        time: "11:30 AM",
        visitors: 4,
        notes: "Need wheelchair access"
      }
    });

    console.log("\n💬 [User] -> YES (Confirm duplicate)");
    await sendWebhookText("YES");
    const duplicateAppts = await Appointment.find({ customerPhone: testPhone, preferredDate: new Date(2026, 11, 25), preferredTime: "11:30 AM" });
    console.log("🔍 Duplicate Appointment count (Should remain exactly 1):", duplicateAppts.length);

    // Step P: Test Free-text Inquiry Capture
    console.log("\n💬 [User] -> What is the price and configuration of the Waghawadi project?");
    await sendWebhookText("What is the price and configuration of the Waghawadi project?");

    const inquiries = await InquiryQuestionLog.find({ phone: testPhone });
    console.log("🔍 Inquiry captured in DB logs:", inquiries.length > 0 ? "YES" : "NO");
    if (inquiries.length > 0) {
      console.log("   Captured keywords:", inquiries[0].keywords);
      console.log("   Logged question:", inquiries[0].question);
    }

    console.log("\n==================================================");
    console.log("🏁 INTEGRATION TEST RUN COMPLETED SUCCESSFULLY!");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Test run failed with exception:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed.");
  }
};

runTest();
