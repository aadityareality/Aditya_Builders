import "dotenv/config";
import axios from "axios";

const wabaId = "2269311140508044";
const token = process.env.WHATSAPP_ACCESS_TOKEN;

const run = async () => {
  console.log("Creating image_broadcast template with IMAGE HEADER...");
  
  const payload = {
    name: "image_broadcast",
    category: "MARKETING",
    language: "en",
    components: [
      {
        type: "HEADER",
        format: "IMAGE",
        example: {
          header_url: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"]
        }
      },
      {
        type: "BODY",
        text: "Hello, {{1}}!\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
        example: {
          body_text: [["Yakshit Koshiya", "Check out this property!"]]
        }
      }
    ]
  };

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
      payload,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    console.log("✅ Template created:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Failed:", err.response?.data || err.message);
  }
};

run();
