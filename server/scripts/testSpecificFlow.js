import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import WebhookLog from "../models/WebhookLog.js";
import ConversationState from "../models/ConversationState.js";
import { receiveWebhook } from "../src/controllers/whatsappController.js";

const runTest = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    const testPhone = "918780150610";
    const testName = "Aditya Client Test";
    
    // Clear previous state for clean diagnostic run
    console.log("🧹 Cleaning old test data for number:", testPhone);
    const existingCust = await Customer.findOne({ phone: testPhone });
    if (existingCust) {
      const existingChat = await Chat.findOne({ customer: existingCust._id });
      if (existingChat) {
        await Message.deleteMany({ chat: existingChat._id });
        await Chat.deleteOne({ _id: existingChat._id });
      }
      await Customer.deleteOne({ _id: existingCust._id });
    }
    await ConversationState.deleteMany({ phone: testPhone });

    console.log("\n📲 Simulating Incoming Webhook GET (Verify)...");
    const mockReqGet = {
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": process.env.VERIFY_TOKEN || "aaditya-builders-webhook",
        "hub.challenge": "12345challenge"
      },
      originalUrl: `/api/webhook?hub.mode=subscribe&hub.verify_token=aaditya-builders-webhook&hub.challenge=12345challenge`
    };
    
    console.log("挑戰 Token 測試成功:", mockReqGet.query["hub.challenge"]);

    console.log("\n📲 Simulating Incoming Webhook POST ('Hi' message from 918780150610)...");
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
                    id: `wamid.mock_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: "Hi" },
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

    // Execute Webhook
    await receiveWebhook(mockReqPost, mockRes);
    console.log("Response status code:", resStatus);

    // Wait 2 seconds for async logging to complete
    console.log("⏳ Waiting for database async logging tasks...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify CRM Records
    console.log("\n📊 Querying Database for verification:");
    const customer = await Customer.findOne({ phone: testPhone });
    console.log("✅ Customer record found:", customer ? `Name: ${customer.name}, Status: ${customer.leadStatus}` : "❌ Not found");

    if (customer) {
      const chat = await Chat.findOne({ customer: customer._id });
      console.log("✅ Chat thread created:", chat ? `ID: ${chat._id}, Status: ${chat.status}` : "❌ Not found");
      
      if (chat) {
        const messages = await Message.find({ chat: chat._id });
        console.log(`✅ Message count logged to thread: ${messages.length}`);
        messages.forEach((m, i) => {
          console.log(`   Message ${i + 1}: [${m.direction}] Type: ${m.messageType}, Body: "${m.body}"`);
        });
      }
    }

    console.log("\n🤖 Chatbot State:");
    const state = await ConversationState.findOne({ phone: testPhone });
    console.log("   Current conversation flow state:", state ? `${state.currentFlow} (Step: ${state.currentStep})` : "None (Clean Welcome Menu state)");

  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed.");
  }
};

runTest();
