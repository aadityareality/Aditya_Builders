import "dotenv/config";
import connectDB from "../config/db.js";
import { transcribeAudio, analyzeImageContent, generateCompletion } from "../src/services/openAiService.js";
import Customer from "../models/Customer.js";

const runTest = async () => {
  try {
    console.log("⚡ Starting Group D Verification Tests...");
    await connectDB();

    let customer = await Customer.findOne({ phone: "919974858500" });
    if (!customer) {
      customer = await Customer.create({
        name: "Test Customer",
        phone: "919974858500",
        source: "WhatsApp"
      });
    }

    // 1. Whisper audio translation mock check
    console.log("\n🎙️ Testing Whisper translation mock...");
    const transcription = await transcribeAudio(customer.phone, null, "audio/ogg", customer._id);
    console.log("   Transcription output:", transcription.text);
    if (!transcription.text) {
      console.error("❌ Whisper mock failed.");
      process.exit(1);
    }

    // 2. Vision mock classification
    console.log("\n👁️ Testing GPT Vision floor plan classification mock...");
    const floorPlanAnalysis = await analyzeImageContent(customer.phone, "https://cloudinary.com/floor_plan_2bhk.jpg", customer._id);
    console.log("   Vision output classification:", floorPlanAnalysis.type);
    console.log("   Vision output description:", floorPlanAnalysis.description);
    if (floorPlanAnalysis.type !== "floor_plan") {
      console.error("❌ Vision floor plan detection failed.");
      process.exit(1);
    }

    // 3. Multilingual instruction check
    console.log("\n🗣️ Testing Multilingual system prompt (English, Hindi, Gujarati)...");
    const systemPrompt = `You are a multilingual AI assistant for Aaditya Builders.
Respond in the language of the prompt: English, Hindi, or Gujarati.`;
    
    console.log("   --- English Query ---");
    const enRes = await generateCompletion(customer.phone, systemPrompt, "What is the RERA registration status?", customer._id);
    console.log("   Reply:", enRes.text);

    console.log("   --- Gujarati Query ---");
    const guRes = await generateCompletion(customer.phone, systemPrompt, "ભાવનગર પ્રોજેક્ટ ક્યારે પૂરો થશે?", customer._id);
    console.log("   Reply:", guRes.text);

    console.log("\n✅ GROUP D VERIFICATION RUN COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Group D test script failed:", err);
    process.exit(1);
  }
};

runTest();
