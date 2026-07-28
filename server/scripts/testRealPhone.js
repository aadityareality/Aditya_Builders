import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function testRealPhone() {
  const token = whatsappConfig.accessToken;
  const phoneId = whatsappConfig.phoneNumberId;
  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const testPhones = ["919725454581", "919724362936"];

  for (const phone of testPhones) {
    console.log(`\nTesting client_greeting template to ${phone}...`);
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: "client_greeting",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "MONTUBHAI" },
              { type: "text", text: "hiiiii" }
            ]
          }
        ]
      }
    };

    try {
      const res = await axios.post(url, payload, { headers });
      console.log("✅ SUCCESS for", phone, ":", res.data);
      break;
    } catch (err) {
      console.error("❌ FAILED for", phone, ":", JSON.stringify(err.response?.data || err.message));
    }
  }
}

testRealPhone();
