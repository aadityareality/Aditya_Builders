import "dotenv/config";
import axios from "axios";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = "2269311140508044"; // Your WhatsApp Business Account ID

  console.log("🚀 Creating new WhatsApp Template 'aditya_broadcast'...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const payload = {
    name: "aditya_broadcast",
    category: "MARKETING",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Dear Client,\n\nWe have an exciting update regarding our properties.\n\nhello, {{1}} !\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
        example: {
          body_text: [
            [
              "Yakshit Koshiya",
              "kem cho?"
            ]
          ]
        }
      }
    ]
  };

  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ Template created successfully!");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Failed to create template:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
