import "dotenv/config";
import axios from "axios";

const listTemplates = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
  const wabaId = "2269311140508044"; // WABA ID from logs

  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Approved Meta Templates:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error fetching templates:", err.response?.data || err.message);
  }
};

listTemplates();
