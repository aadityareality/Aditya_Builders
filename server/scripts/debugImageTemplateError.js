import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function debugImageTemplate() {
  const token = whatsappConfig.accessToken;
  const phoneId = whatsappConfig.phoneNumberId;
  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const testPhone = "918238285656"; // Mahipal's phone or 919725454581
  const imageUrl = "https://res.cloudinary.com/dcysihl0/image/upload/v1785231862/adityabuilders/inquiries/r5uuljwcko20k8i7yxmd.jpg";

  console.log(`Debug sending aditya_image_update to ${testPhone}...`);

  const payload = {
    messaging_product: "whatsapp",
    to: testPhone,
    type: "template",
    template: {
      name: "aditya_image_update",
      language: { code: "en" },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: { link: imageUrl }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: "Mahipal" },
            { type: "text", text: "heello" }
          ]
        }
      ]
    }
  };

  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ FAILED:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

debugImageTemplate();
