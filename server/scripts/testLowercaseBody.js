import "dotenv/config";
import { sendTemplateMessage } from "../src/services/whatsappService.js";

async function testFix() {
  console.log("Testing template send with lowercase component type 'body'...");
  try {
    const res = await sendTemplateMessage("919974858500", "client_greeting", "en", [
      {
        type: "body",
        parameters: [
          { type: "text", text: "Yakshit Koshiya" },
          { type: "text", text: "hiiiii" }
        ]
      }
    ]);
    console.log("✅ SUCCESS! Response:");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}

testFix();
