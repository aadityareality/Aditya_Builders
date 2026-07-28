import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function inspectAdityaUpdate() {
  const token = whatsappConfig.accessToken;
  const wabaId = "2269311140508044";

  console.log("Inspecting aditya_update template details from Meta API...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=aditya_update`;
  const headers = {
    Authorization: `Bearer ${token}`
  };

  try {
    const res = await axios.get(url, { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error inspecting template:", err.response?.data || err.message);
  }
}

inspectAdityaUpdate();
