import "dotenv/config";
import whatsappConfig from "../src/config/whatsappConfig.js";
import * as whatsappService from "../src/services/whatsappService.js";

const run = async () => {
  console.log("Current access token loaded on start:");
  console.log(`- Token preview: ${whatsappConfig.accessToken?.substring(0, 15)}...`);
  console.log(`- Phone ID: ${whatsappConfig.phoneNumberId}`);

  try {
    const to = "918780150610";
    console.log(`Attempting to send a real text message to ${to}...`);
    const res = await whatsappService.sendTextMessage(to, "Hello from the diagnostics script!");
    console.log("Response from Meta:", JSON.stringify(res, null, 2));
    console.log("✅ Send test succeeded!");
  } catch (err) {
    console.error("❌ Send test failed!");
    console.error("Error Message:", err.message);
  }
};
run();
