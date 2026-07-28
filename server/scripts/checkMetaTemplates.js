import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function checkTemplates() {
  const token = whatsappConfig.accessToken;
  const wabaId = "2269311140508044"; // WABA ID from createTemplate.js or env

  console.log("Checking Meta WhatsApp Templates...");
  const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates?limit=100`;
  const headers = {
    Authorization: `Bearer ${token}`
  };

  try {
    const res = await axios.get(url, { headers });
    console.log(`Found ${res.data.data.length} templates:`);
    for (const t of res.data.data) {
      console.log(`\n-------------------------------------`);
      console.log(`Name: ${t.name} | Status: ${t.status} | Category: ${t.category} | Language: ${t.language}`);
      for (const comp of t.components || []) {
        if (comp.type === "BODY") console.log(`Body Text: "${comp.text}"`);
      }
    }
  } catch (err) {
    console.error("Error fetching templates:", err.response?.data || err.message);
  }
}

checkTemplates();
