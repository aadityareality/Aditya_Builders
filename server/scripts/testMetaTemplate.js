import "dotenv/config";
import axios from "axios";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = "918780150610"; // Yakshit test phone number
  
  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  
  const originalText = 
    `🔔 *Reminder*\n\n` +
    `Your site visit for *Aaditya Skyline*\n` +
    `is scheduled *upcoming* at *11:00 AM*.\n\n` +
    `📍 *Office Address:* Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat\n` +
    `🗺️ *Google Maps:* https://www.google.com/maps?q=21.7484,72.1328\n` +
    `📞 *Contact Number:* +91 99748 58500`;

  // Clean text: replace newlines/tabs with space, collapse spaces to single
  const cleanedText = originalText
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: "marketing_promotion",
      language: { code: "en" },
      components: [
        {
          type: "BODY",
          parameters: [
            { type: "text", text: cleanedText }
          ]
        }
      ]
    }
  };
  
  console.log("🚀 Testing cleanedText parameter...");
  try {
    const res = await axios.post(url, payload, { headers });
    console.log("✅ Success:", res.data);
  } catch (err) {
    console.error("❌ Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
