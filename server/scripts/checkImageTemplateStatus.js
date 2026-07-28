import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function checkStatus() {
  const token = whatsappConfig.accessToken;
  const wabaId = "2269311140508044";

  console.log("Checking status of aditya_image_update template...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=aditya_image_update`;
  const headers = {
    Authorization: `Bearer ${token}`
  };

  try {
    const res = await axios.get(url, { headers });
    const template = res.data.data[0];
    if (template) {
      console.log(`Template: ${template.name} | Status: ${template.status} | ID: ${template.id}`);
    } else {
      console.log("Template not found yet.");
    }
  } catch (err) {
    console.error("Error checking status:", err.response?.data || err.message);
  }
}

checkStatus();
