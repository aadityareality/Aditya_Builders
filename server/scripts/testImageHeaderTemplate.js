import "dotenv/config";
import axios from "axios";

const testHeader = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
  const to = "919913863602"; // Yash phone number
  const imageUrl = "https://res.cloudinary.com/dcysihl0/image/upload/v1785134266/adityabuilders/inquiries/wrgnrlf3qqimhi37vprs.jpg";

  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  console.log("Test 1: Direct Image Payload...");
  try {
    const res1 = await axios.post(url, {
      messaging_product: "whatsapp",
      to: to,
      type: "image",
      image: {
        link: imageUrl,
        caption: "Direct image test from Aditya Builders"
      }
    }, { headers });
    console.log("✅ Direct Image Result:", res1.data);
  } catch (err) {
    console.error("❌ Direct Image Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }

  console.log("\nTest 2: Template with Image Header...");
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
              { type: "text", text: "Check out this property visual" }
            ]
          }
        ]
      }
    }, { headers });
    console.log("✅ Header Template Result:", res2.data);
  } catch (err) {
    console.error("❌ Header Template Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

testHeader();
