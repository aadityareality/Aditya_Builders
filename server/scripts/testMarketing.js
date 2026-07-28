import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function testMarketing() {
  const token = whatsappConfig.accessToken;
  const phoneId = whatsappConfig.phoneNumberId;
  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const payload = {
    messaging_product: "whatsapp",
    to: "919974858500",
    type: "template",
    template: {
      name: "marketing_promotion",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "hiiiii" }
          ]
        }
      ]
    }
  };

  console.log("Testing marketing_promotion...");
  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ SUCCESS:", res.data);
  } catch (err) {
    console.error("❌ FAILED:", JSON.stringify(err.response?.data || err.message));
  }
}

testMarketing();
