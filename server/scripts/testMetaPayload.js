import "dotenv/config";
import { sendTextMessage } from "../src/services/whatsappService.js";

const run = async () => {
  const to = "918780150610";
  const text = "hello, JAY SHREE KRISHNA 🌺\nkem cho?\nmaja ma?";
  
  console.log("🚀 Testing sendTextMessage fallback to template...");
  try {
    const res = await sendTextMessage(to, text);
    console.log("✅ Success:", res);
  } catch (err) {
    console.error("❌ Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
