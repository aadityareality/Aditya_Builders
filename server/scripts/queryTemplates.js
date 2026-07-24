import "dotenv/config";
import axios from "axios";

const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "563032543567848"; // We can fetch it or try with the credentials we have
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Let's first try to get the WhatsApp Business Account ID from Meta by calling the phone number node details
  console.log("🚀 Querying Phone Number details to get Business Account ID...");
  let wabaId = businessId;
  try {
    const phoneRes = await axios.get(`https://graph.facebook.com/v23.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Phone Number details:", phoneRes.data);
    wabaId = phoneRes.data.whatsapp_business_account?.id || wabaId;
    console.log("Found WhatsApp Business Account ID:", wabaId);
  } catch (err) {
    console.error("Could not fetch phone details:", err.response?.data || err.message);
  }

  console.log("🚀 Querying all templates from WABA...");
  try {
    const templatesRes = await axios.get(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Approved Templates:");
    console.log(JSON.stringify(templatesRes.data, null, 2));
  } catch (err) {
    console.error("❌ Failed to query templates:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
