import "dotenv/config";
import axios from "axios";

const testTemplates = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
  const to = "917567232413"; // Ramesh phone number from screenshot

  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  console.log("Testing client_greeting template...");
  try {
    const res1 = await axios.post(url, {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "client_greeting",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Ramesh" },
              { type: "text", text: "Hello Ramesh, this is a test message from Aditya Builders." }
            ]
          }
        ]
      }
    }, { headers });
    console.log("✅ client_greeting Result:", res1.data);
  } catch (err) {
    console.log("❌ client_greeting Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }

  console.log("\nTesting marketing_promotion template...");
  try {
    const res2 = await axios.post(url, {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "marketing_promotion",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Hello Ramesh, this is Aditya Builders! How can we assist you today?" }
            ]
          }
        ]
      }
    }, { headers });
    console.log("✅ marketing_promotion Result:", res2.data);
  } catch (err) {
    console.log("❌ marketing_promotion Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

testTemplates();
