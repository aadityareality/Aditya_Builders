import "dotenv/config";
import axios from "axios";
import whatsappConfig from "../src/config/whatsappConfig.js";

async function createImageTemplate() {
  const token = whatsappConfig.accessToken;
  const wabaId = "2269311140508044";
  const appId = "1383792036573030"; // App ID if needed

  console.log("🚀 Step 1: Uploading sample image to Meta Resumable Upload API...");

  // Sample image URL from Cloudinary
  const sampleImageUrl = "https://res.cloudinary.com/dcysihl0/image/upload/v1785231862/adityabuilders/inquiries/r5uuljwcko20k8i7yxmd.jpg";

  // First fetch image buffer
  const imgRes = await axios.get(sampleImageUrl, { responseType: "arraybuffer" });
  const imgBuffer = Buffer.from(imgRes.data);
  const fileLength = imgBuffer.length;

  console.log(`Image fetched (${fileLength} bytes). Creating Meta upload session...`);

  const sessionUrl = `https://graph.facebook.com/v23.0/app/uploads?file_length=${fileLength}&file_type=image/jpeg&access_token=${token}`;
  const sessionRes = await axios.post(sessionUrl);
  const uploadSessionId = sessionRes.data.id;
  console.log(`Session created ID: ${uploadSessionId}`);

  // Initiate file upload
  const uploadUrl = `https://graph.facebook.com/v23.0/${uploadSessionId}`;
  const uploadRes = await axios.post(uploadUrl, imgBuffer, {
    headers: {
      Authorization: `OAuth ${token}`,
      file_offset: 0,
      "Content-Type": "image/jpeg"
    }
  });

  const headerHandle = uploadRes.data.h;
  console.log(`✅ Image uploaded to Meta! Header Handle: ${headerHandle}`);

  console.log("\n🚀 Step 2: Creating Meta Template 'aditya_image_update' with IMAGE HEADER...");
  const templateUrl = `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;
  const templateHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const payload = {
    name: "aditya_image_update",
    category: "MARKETING",
    language: "en",
    components: [
      {
        type: "HEADER",
        format: "IMAGE",
        example: {
          header_handle: [headerHandle]
        }
      },
      {
        type: "BODY",
        text: "Hello, {{1}}!\n\n{{2}}\n\nBest regards,\nAditya Builders Team",
        example: {
          body_text: [
            [
              "Yakshit Koshiya",
              "Check out our latest project details."
            ]
          ]
        }
      }
    ]
  };

  try {
    const res = await axios.post(templateUrl, payload, { headers: templateHeaders });
    console.log("🎉 SUCCESS! Template 'aditya_image_update' submitted to Meta!");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Failed to create image template:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

createImageTemplate();
