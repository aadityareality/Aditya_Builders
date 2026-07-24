import "dotenv/config";
import axios from "axios";

const wabaId = "2269311140508044";
const run = async () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Step 1: Delete existing simple_greeting
  console.log("🗑️ Deleting existing simple_greeting template...");
  try {
    const delRes = await axios.delete(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=simple_greeting`,
      { headers }
    );
    console.log("✅ Deleted:", JSON.stringify(delRes.data));
  } catch (err) {
    console.warn("⚠️ Delete result:", JSON.stringify(err.response?.data || err.message));
  }

  // Wait a moment for deletion to propagate
  await new Promise(r => setTimeout(r, 3000));

  // Step 2: Recreate with updated body (no "We have a message..." line)
  console.log("🚀 Creating updated simple_greeting template...");
  const payload = {
    name: "simple_greeting",
    category: "MARKETING",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hello, {{1}}!\n\n{{2}}\n\nThank you for your time.",
        example: {
          body_text: [["Yakshit Koshiya", "kem cho?"]]
        }
      }
    ]
  };

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
      payload,
      { headers }
    );
    console.log("✅ Created:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Create failed:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
};

run();
