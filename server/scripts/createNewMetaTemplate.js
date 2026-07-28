import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function createNewTemplate() {
  const token = whatsappConfig.accessToken;
  const wabaId = "2269311140508044";

  console.log("🚀 Creating new Meta WhatsApp Template 'aditya_update'...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const payload = {
    name: "aditya_update",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hello, {{1}}!\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
        example: {
          body_text: [
            [
              "Yakshit Koshiya",
              "We have updated property details for you."
            ]
          ]
        }
      }
    ]
  };

  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ Template 'aditya_update' created successfully!");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Failed to create template:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

createNewTemplate();
