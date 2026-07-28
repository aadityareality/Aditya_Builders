import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function testVarious() {
  const token = whatsappConfig.accessToken;
  const phoneId = whatsappConfig.phoneNumberId;
  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const testCases = [
    {
      name: "en with body type uppercase BODY",
      payload: {
        messaging_product: "whatsapp",
        to: "919974858500",
        type: "template",
        template: {
          name: "client_greeting",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Yakshit" },
                { type: "text", text: "hiiiii" }
              ]
            }
          ]
        }
      }
    },
    {
      name: "en_US language code",
      payload: {
        messaging_product: "whatsapp",
        to: "919974858500",
        type: "template",
        template: {
          name: "client_greeting",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Yakshit" },
                { type: "text", text: "hiiiii" }
              ]
            }
          ]
        }
      }
    },
    {
      name: "aditya_update template",
      payload: {
        messaging_product: "whatsapp",
        to: "919974858500",
        type: "template",
        template: {
          name: "aditya_update",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Yakshit" },
                { type: "text", text: "hiiiii" }
              ]
            }
          ]
        }
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    try {
      const res = await axios.post(url, tc.payload, { headers });
      console.log("✅ SUCCESS:", res.data);
      break;
    } catch (err) {
      console.error("❌ FAILED:", JSON.stringify(err.response?.data || err.message));
    }
  }
}

testVarious();
