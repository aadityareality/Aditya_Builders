import "dotenv/config";
import axios from "axios";

const wabaId = "2269311140508044";
const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Try progressively longer static text to pass Meta's ratio requirement
  const bodies = [
    "Hello, {{1}}!\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
    "Dear {{1}},\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
    "Hello, {{1}}!\n\nWe have an update for you:\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
  ];

  for (const bodyText of bodies) {
    console.log(`\n🚀 Trying body: "${bodyText.replace(/\n/g, "\\n")}"...`);
    const payload = {
      name: "client_greeting",
      category: "MARKETING",
      language: "en",
      components: [
        {
          type: "BODY",
          text: bodyText,
          example: {
            body_text: [["Yakshit Koshiya", "kem cho?"]]
          }
        }
      ]
    };

    try {
      const res = await axios.post(
        `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
        payload,
        { headers }
      );
      console.log("✅ Approved! Result:", JSON.stringify(res.data, null, 2));
      break; // stop on first success
    } catch (err) {
      const msg = err.response?.data?.error?.error_user_title || err.message;
      console.warn(`⚠️ Failed (${msg}), trying next...`);
    }
  }
};

run();
