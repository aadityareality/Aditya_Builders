import "dotenv/config";
import axios from "axios";

const testImageTemplate = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
  const to = "919913863602"; // Yash phone number

  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  console.log("Testing image_broadcast template payload...");
  try {
    const res = await axios.post(url, {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "image_broadcast",
        language: { code: "en" },
        components: [
          {
            type: "HEADER",
            parameters: [
              {
                type: "image",
                image: { link: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" }
              }
            ]
          },
          {
            type: "BODY",
            parameters: [
              { type: "text", text: "Yash" },
              { type: "text", text: "Check out this project layout from Aditya Builders" }
            ]
          }
        ]
      }
    }, { headers });
    console.log("✅ image_broadcast Result:", res.data);
  } catch (err) {
    console.error("❌ image_broadcast Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

testImageTemplate();
