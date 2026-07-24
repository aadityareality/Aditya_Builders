import "dotenv/config";
import axios from "axios";

const wabaId = "2269311140508044";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Try different categories and minimal bodies
  const attempts = [
    { name: "quick_message", category: "UTILITY",   text: "Hello, {{1}}!\n\n{{2}}" },
    { name: "quick_message", category: "MARKETING",  text: "Hello, {{1}}!\n\n{{2}}" },
    { name: "quick_message", category: "UTILITY",   text: "Hello, {{1}}!\n\n{{2}}." },
    { name: "quick_message", category: "UTILITY",   text: "Hi {{1}},\n\n{{2}}" },
    { name: "quick_message", category: "UTILITY",   text: "Hello {{1}},\n\n{{2}}\n\n- Aditya Builders" },
  ];

  for (const attempt of attempts) {
    console.log(`\n🚀 Trying [${attempt.category}]: "${attempt.text.replace(/\n/g, "\\n")}"...`);
    const payload = {
      name: attempt.name,
      category: attempt.category,
      language: "en",
      components: [
        {
          type: "BODY",
          text: attempt.text,
          example: { body_text: [["Yakshit Koshiya", "kem cho?"]] }
        }
      ]
    };
    try {
      const res = await axios.post(
        `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
        payload,
        { headers }
      );
      console.log("✅ APPROVED:", JSON.stringify(res.data));
      break;
    } catch (err) {
      const errTitle = err.response?.data?.error?.error_user_title || "";
      const errMsg   = err.response?.data?.error?.error_user_msg  || err.message;
      console.warn(`⚠️ Failed: ${errTitle} — ${errMsg}`);
    }
  }
};

run();
