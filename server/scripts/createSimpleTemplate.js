import "dotenv/config";
import axios from "axios";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = "2269311140508044";

  console.log("🚀 Creating new clean template 'simple_greeting'...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const payload = {
    name: "simple_greeting",
    category: "MARKETING",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hello, {{1}}!\n\nWe have a message for you from Aditya Builders:\n\n{{2}}\n\nThank you for your time.",
        example: {
          body_text: [
            ["Yakshit Koshiya", "kem cho?"]
          ]
        }
      }
    ]
  };

  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ Template result:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
