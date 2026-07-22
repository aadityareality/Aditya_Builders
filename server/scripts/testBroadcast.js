import "dotenv/config";

// Clear env variables so the config loads empty values and triggers the mock fallback
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.ACCESS_TOKEN = "";

const run = async () => {
  // Dynamically import dependencies after clearing env variables
  const { default: mongoose } = await import("mongoose");
  const { default: connectDB } = await import("../config/db.js");
  const { default: Customer } = await import("../models/Customer.js");
  const { default: Chat } = await import("../models/Chat.js");
  const { default: Message } = await import("../models/Message.js");
  const { default: Admin } = await import("../models/Admin.js");
  const { sendCrmBroadcast } = await import("../controllers/adminCrmController.js");

  await connectDB();

  console.log("🧹 Setting up test data...");
  
  // Set up mock superadmin and customer
  let admin = await Admin.findOne({ role: "superadmin" });
  if (!admin) {
    admin = await Admin.create({
      name: "Super Admin",
      email: "broadcast-super@test.com",
      password: "password123",
      role: "superadmin"
    });
  }

  let customer = await Customer.findOne({ phone: "918780150610" });
  if (!customer) {
    customer = await Customer.create({
      phone: "918780150610",
      name: "Audience Target One",
      leadStatus: "New"
    });
  }

  // Mock Request/Response objects
  const req = {
    body: {
      customerIds: [customer._id.toString()],
      messageType: "text",
      body: "Test Campaign: Welcome to Aditya Builders!"
    },
    admin: {
      _id: admin._id,
      role: "superadmin"
    }
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };

  console.log("📋 Executing campaign broadcast simulation...");
  try {
    const fn = sendCrmBroadcast;
    await fn(req, res, (err) => {
      if (err) console.error("Express next() called with error:", err);
    });
    if (req.campaignPromise) {
      console.log("⏳ Awaiting background campaign process...");
      await req.campaignPromise;
    }
  } catch (err) {
    console.error("Caught error during execute:", err);
  }

  console.log("Response Code:", res.statusCode);
  console.log("Response Body:", JSON.stringify(res.jsonData, null, 2));

  if ((res.statusCode === 200 || res.statusCode === 202) && res.jsonData && res.jsonData.success) {
    console.log("✅ Campaign broadcast test passed successfully!");
    
    // Verify Chat and Message were created
    const chat = await Chat.findOne({ customer: customer._id });
    if (chat) {
      console.log(`- Found Chat thread with status: ${chat.status}`);
      const latestMsg = await Message.findOne({ chat: chat._id }).sort({ createdAt: -1 });
      if (latestMsg) {
        console.log(`- Found Outgoing Message body: "${latestMsg.body}"`);
        console.log(`- Meta Message ID: ${latestMsg.metaMessageId}`);
        // Clean up message
        await Message.deleteOne({ _id: latestMsg._id });
      }
      // Clean up chat
      await Chat.deleteOne({ _id: chat._id });
    }
  } else {
    console.error("❌ Campaign broadcast test failed!");
  }

  // Cleanup testing entries
  await Customer.deleteOne({ _id: customer._id });
  if (admin.email === "broadcast-super@test.com") {
    await Admin.deleteOne({ _id: admin._id });
  }
  
  await mongoose.connection.close();
};

run();
