import "dotenv/config";
import connectDB from "../config/db.js";
import { receiveWebhook } from "../src/controllers/whatsappController.js";
import Project from "../models/Project.js";
import Customer from "../models/Customer.js";

const runTest = async () => {
  try {
    await connectDB();

    // Clean up test customer from database to avoid duplicate conflicts
    await Customer.deleteMany({ phone: "918754215457" });

    // Ensure Shreeji Aaditya exists with a cover image
    let proj = await Project.findOne({ title: "Shreeji Aaditya" });
    if (!proj) {
      proj = await Project.create({
        title: "Shreeji Aaditya",
        slug: "shreeji-aaditya",
        type: "Residential",
        configuration: "2 BHK",
        status: "Completed",
        location: "Shivomnagar, Bhavnagar",
        description: "Elegant residential apartments.",
        startingPrice: "₹18.75 Lakh onwards",
        coverImage: { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId: "sample" }
      });
      console.log("🏢 Created Shreeji Aaditya dummy project for test validation.");
    }

    // Mock Express Request and Response mimicking the screenshot message text
    const mockMsgText = 
      `Hi, I'm interested in this gallery design:\n\n` +
      `Name: Yakshit koshiya\n` +
      `Email: aadityareali@gmail.com\n` +
      `Phone: 8754215457\n` +
      `Design/Image: Shreeji Aaditya - Day View (Exterior)\n` +
      `Message: Hi, I'm interested in this design (Reference: "Shreeji Aaditya - Day View"). Please share pricing and details.`;

    const req = {
      body: {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "123456",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "919974858500", phone_number_id: "105574895627700" },
                  contacts: [{ profile: { name: "Yakshit" }, wa_id: "918754215457" }],
                  messages: [
                    {
                      from: "918754215457",
                      id: `wamid.HBgLOTE5OTc0ODU4NTAwFQIAERgSRDMzRDM1OUVEQzZDQzU0QzY5RQA=_${Date.now()}`,
                      timestamp: Math.round(Date.now() / 1000),
                      text: { body: mockMsgText },
                      type: "text"
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      }
    };

    const res = {
      status: (code) => {
        console.log(`   HTTP Status Response: ${code}`);
        return {
          json: (data) => console.log("   JSON Response:", data),
          send: (data) => console.log("   Send Response:", data)
        };
      }
    };

    console.log("\n🚀 Triggering simulated Web Gallery Inquiry Webhook...");
    await receiveWebhook(req, res);

    // Retrieve database record
    const cust = await Customer.findOne({ phone: "918754215457" });
    if (!cust) {
      console.error("❌ Customer was not created!");
      process.exit(1);
    }

    console.log(`\n👤 Customer record details in DB:`);
    console.log(`   Name  : ${cust.name}`);
    console.log(`   Email : ${cust.email}`);
    console.log(`   Status: ${cust.leadStatus}`);
    console.log(`   Score : ${cust.leadScore}`);

    if (cust.name !== "Yakshit koshiya" || cust.email !== "aadityareali@gmail.com") {
      console.error("❌ Customer details were not updated correctly from inquiry fields!");
      process.exit(1);
    }

    console.log("\n✅ WEB GALLERY INQUIRY FLOW VERIFICATION RUN COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
};

runTest();
