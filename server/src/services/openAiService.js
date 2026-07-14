import { OpenAI } from "openai";
import AiLog from "../../models/AiLog.js";

let openaiInstance = null;

const getOpenAI = () => {
  if (openaiInstance) return openaiInstance;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("mock-")) {
    return null;
  }
  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
};

const RATES = {
  "gpt-4o-mini": { input: 0.150 / 1000000, output: 0.600 / 1000000 },
  "gpt-4o": { input: 2.50 / 1000000, output: 10.00 / 1000000 },
  "whisper-1": { ratePerSecond: 0.006 / 60 },
  "default": { input: 0.150 / 1000000, output: 0.600 / 1000000 }
};

export const checkRateLimit = async (customerPhone) => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const count = await AiLog.countDocuments({
      customerPhone,
      createdAt: { $gte: oneHourAgo }
    });
    return count < 50;
  } catch (err) {
    console.error("⚠️ Rate limit check failed:", err.message);
    return true; 
  }
};

export const sanitizeInput = (text) => {
  if (!text) return "";
  const normalized = text.toLowerCase();
  const injectionPatterns = [
    "ignore previous",
    "ignore prior",
    "ignore all instructions",
    "forget what",
    "system prompt",
    "reveal instructions",
    "you are now an",
    "act as a"
  ];
  
  let isSuspicious = false;
  for (const pattern of injectionPatterns) {
    if (normalized.includes(pattern)) {
      isSuspicious = true;
      break;
    }
  }

  if (isSuspicious) {
    console.warn("🛡️ [AI Service] Suspicious input pattern detected. Neutralizing.");
    return "[CLEANED USER INPUT] " + text.replace(/ignore|system|instruction|prior/gi, "");
  }
  return text;
};

/**
 * Mock completion generator for developer-friendly testing when no key is set.
 */
const generateMockCompletion = (systemPrompt, userPrompt) => {
  const text = userPrompt.toLowerCase();
  
  // 1. FAQ matching simulation
  if (text.includes("document") || text.includes("book")) {
    return "To book a flat, you need to provide Aadhaar Card, PAN Card, passport size photographs, and a booking cheque of Rs 1,00,000.";
  }
  if (text.includes("loan") || text.includes("finance")) {
    return "Yes, Aaditya Builders is associated with SBI, HDFC, and ICICI banks. We provide full loan assistance and documentation support.";
  }
  if (text.includes("rera")) {
    return "RERA stands for Real Estate Regulatory Authority. All our ongoing projects like Aaditya Elegance and Aaditya Skyline are fully registered under Gujarat RERA.";
  }
  if (text.includes("price") || text.includes("how much") || text.includes("cost")) {
    if (text.includes("elegance")) return "Aaditya Elegance starts from ₹31.20 Lakh onwards for 2/3 BHK units.";
    if (text.includes("skyline")) return "Aaditya Skyline starts from ₹24.50 Lakh onwards for 2 BHK units.";
    if (text.includes("shreeji")) return "Shreeji Aaditya starts from ₹18.75 Lakh onwards for 2 BHK units.";
    return "Our projects starting prices range from ₹18.75 Lakh onwards. For example, Aaditya Skyline starts at ₹24.50 Lakh, and Aaditya Elegance starts at ₹31.20 Lakh.";
  }
  if (text.includes("possession") || text.includes("ready")) {
    return "We have both ready and ongoing options. Aaditya Elegance is expected to be delivered by Dec 2026, Aaditya Skyline by Mar 2027, and Shreeji Aaditya was completed in Jun 2023.";
  }

  // 2. Project recommendation simulation
  if (text.includes("recommend") || text.includes("suggest") || text.includes("bhk") || text.includes("budget")) {
    return "Based on your preferences, I highly recommend *Aaditya Skyline* (2 BHK in Jewels Circle, starting at ₹24.50 Lakh) or *Aaditya Elegance* (2/3 BHK in Swaminarayan Green City, starting at ₹31.20 Lakh). Both offer excellent amenities like CCTV, parking, and water supply.";
  }

  return "I don't have information on that specific detail. Let me refer you to a human sales representative to help you further.";
};

/**
 * Core completion handler.
 */
export const generateCompletion = async (customerPhone, systemPrompt, userPrompt, customerId = null) => {
  const startTime = Date.now();
  const client = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Check Rate Limit
  const allowed = await checkRateLimit(customerPhone);
  if (!allowed) {
    return {
      text: "You have reached the maximum number of helper messages for this hour. Please try again later or wait for our sales team to reply.",
      error: "Rate limit exceeded"
    };
  }

  const sanitizedUser = sanitizeInput(userPrompt);

  // If mock mode is active
  if (!client) {
    console.log("ℹ️ [AI Service] Running in Mock completions mode (No API Key).");
    const mockText = generateMockCompletion(systemPrompt, sanitizedUser);
    const latencyMs = Date.now() - startTime;
    
    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "completions",
      model: `${model} (mock)`,
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0,
      latencyMs,
      error: null
    });

    return { text: mockText, usage: { prompt_tokens: 100, completion_tokens: 50 }, cost: 0 };
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedUser }
      ],
      temperature: 0.2,
    });

    const completionText = response.choices[0]?.message?.content || "";
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const latencyMs = Date.now() - startTime;
    const rates = RATES[model] || RATES["default"];
    const cost = (usage.prompt_tokens * rates.input) + (usage.completion_tokens * rates.output);

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "completions",
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost,
      latencyMs,
      error: null
    });

    return { text: completionText, usage, cost };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("❌ [AI Service] Completion failed:", error.message);

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "completions",
      model,
      error: error.message,
      latencyMs
    });

    return {
      text: "I'm having trouble retrieving that information. Let me check with our sales desk and get back to you.",
      error: error.message
    };
  }
};

/**
 * Sentiment & Intent extraction.
 */
export const analyzeSentimentAndIntent = async (customerPhone, userMessage, customerId = null) => {
  const client = getOpenAI();
  const text = userMessage.toLowerCase();

  if (!client) {
    // Mock parsing
    console.log("ℹ️ [AI Service] Running in Mock sentiment analysis mode.");
    let sentiment = "Interested";
    if (text.includes("angry") || text.includes("bad") || text.includes("worst") || text.includes("cheat")) {
      sentiment = "Angry";
    } else if (text.includes("confused") || text.includes("how") || text.includes("why")) {
      sentiment = "Confused";
    } else if (text.includes("urgent") || text.includes("asap") || text.includes("now")) {
      sentiment = "Urgent";
    }

    const intentFlags = [];
    if (text.includes("invest") || text.includes("roi")) intentFlags.push("Investment Buyer");
    if (text.includes("family") || text.includes("self") || text.includes("own")) intentFlags.push("Family Buyer");
    if (text.includes("call") || text.includes("phone") || text.includes("contact")) intentFlags.push("Callback Requested");
    if (text.includes("brochure") || text.includes("download")) intentFlags.push("Brochure Download");
    if (text.includes("visit") || text.includes("book") || text.includes("appointment")) intentFlags.push("Site Visit Request");

    let budget = "";
    const budgetMatch = text.match(/(\d+)\s*(lakh|cr|crore)/i);
    if (budgetMatch) {
      budget = budgetMatch[0];
    }

    let bhk = "";
    const bhkMatch = text.match(/([234])\s*bhk/i);
    if (bhkMatch) {
      bhk = bhkMatch[0].toUpperCase();
    }

    let location = "";
    if (text.includes("jewels")) location = "Jewels Circle";
    else if (text.includes("green city")) location = "Swaminarayan Green City";
    else if (text.includes("shivomnagar")) location = "Shivomnagar";

    let appointmentConfirmation = {
      confirmed: false,
      date: null,
      time: null,
      project: null
    };

    const confirmMatch = text.match(/(yes|works|confirm|book|reserve|schedule|ok|okay)/i);
    const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (confirmMatch && timeMatch) {
      appointmentConfirmation.confirmed = true;
      appointmentConfirmation.time = timeMatch[0].toUpperCase();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      appointmentConfirmation.date = tomorrow.toISOString().split("T")[0];
      
      if (text.includes("shreeji")) appointmentConfirmation.project = "Shreeji Aaditya";
      else if (text.includes("elegance")) appointmentConfirmation.project = "Aaditya Elegance";
      else if (text.includes("skyline")) appointmentConfirmation.project = "Aaditya Skyline";
      else appointmentConfirmation.project = "Shreeji Aaditya"; // fallback
    }

    return {
      sentiment,
      intentFlags,
      budgetMentioned: budget,
      bhkPreference: bhk,
      locationPreference: location,
      appointmentConfirmation
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an AI data parser. Analyze this real estate customer message and return a JSON object with:
- "sentiment": string (must be one of: Happy, Confused, Angry, Interested, Urgent)
- "intentFlags": array of strings (choose zero or more from: "Investment Buyer", "Family Buyer", "Urgent", "Callback Requested", "Brochure Download", "Site Visit Request")
- "budgetMentioned": string (approx budget if mentioned, e.g. "80 Lakhs", "1.5 Crore", otherwise empty string)
- "bhkPreference": string (e.g. "2 BHK", "3 BHK", otherwise empty string)
- "locationPreference": string (e.g. "Bhavnagar", "Shivomnagar", otherwise empty string)
- "appointmentConfirmation": object containing:
    - "confirmed": boolean (true if user confirms/accepts booking a specific suggested slot/time)
    - "date": string (ISO date YYYY-MM-DD or relative like tomorrow's date if they confirm booking, otherwise null)
    - "time": string (time like "11:30 AM" or "3:00 PM" if they confirm booking, otherwise null)
    - "project": string (project title they want to visit, otherwise null)

JSON format:
{
  "sentiment": "Interested",
  "intentFlags": ["Investment Buyer"],
  "budgetMentioned": "",
  "bhkPreference": "",
  "locationPreference": "",
  "appointmentConfirmation": {
    "confirmed": false,
    "date": null,
    "time": null,
    "project": null
  }
}`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("⚠️ [AI Service] Sentiment analysis failed:", err.message);
    return { 
      sentiment: "Interested", 
      intentFlags: [],
      appointmentConfirmation: { confirmed: false, date: null, time: null, project: null }
    };
  }
};

/**
 * Natural Language Search parsing.
 */
export const parseNluSearch = async (userMessage) => {
  const client = getOpenAI();
  const text = userMessage.toLowerCase();

  if (!client) {
    // Mock NLU Search parsing
    console.log("ℹ️ [AI Service] Running in Mock NLU Search mode.");
    let budgetMax = null;
    let budgetMin = null;
    
    // Simple budget extractor
    const priceMatch = text.match(/under\s*(\d+)\s*lakh/i) || text.match(/less\s*than\s*(\d+)\s*lakh/i) || text.match(/below\s*(\d+)\s*lakh/i);
    if (priceMatch) {
      budgetMax = parseInt(priceMatch[1], 10);
    }
    const crMatch = text.match(/under\s*(\d+(\.\d+)?)\s*(cr|crore)/i);
    if (crMatch) {
      budgetMax = parseFloat(crMatch[1]) * 100;
    }

    let location = null;
    if (text.includes("jewels")) location = "Jewels Circle";
    else if (text.includes("green city")) location = "Green City";
    else if (text.includes("shivomnagar")) location = "Shivomnagar";

    let bhk = null;
    const bhkMatch = text.match(/([23])\s*bhk/i);
    if (bhkMatch) {
      bhk = bhkMatch[0].toUpperCase();
    }

    let possessionType = null;
    if (text.includes("ready") || text.includes("completed")) possessionType = "Ready";
    else if (text.includes("ongoing") || text.includes("construction")) possessionType = "Ongoing";

    const amenities = [];
    if (text.includes("pool")) amenities.push("swimming pool");
    if (text.includes("lift") || text.includes("elevator")) amenities.push("lift");
    if (text.includes("cctv") || text.includes("security")) amenities.push("security");
    if (text.includes("parking")) amenities.push("parking");

    return {
      budgetMax,
      budgetMin,
      location,
      bhk,
      possessionType,
      amenities
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Translate this real estate search query into structured query constraints.
Return a JSON object containing:
- "budgetMax": number (max price in Lakhs. Example: "1 Crore" = 100, "80 Lakhs" = 80. Null if not specified)
- "budgetMin": number (min price in Lakhs. Null if not specified)
- "location": string (locality keyword, null if none)
- "bhk": string (e.g. "2 BHK", "3 BHK", null if none)
- "possessionType": string (must be one of: "Ready", "Ongoing", "Upcoming", null if none)
- "amenities": array of strings (e.g. ["pool", "lift", "parking"], empty array if none)

JSON format:
{
  "budgetMax": null,
  "budgetMin": null,
  "location": null,
  "bhk": null,
  "possessionType": null,
  "amenities": []
}`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("⚠️ [AI Service] NLU search parsing failed:", err.message);
    return null;
  }
};

/**
 * Whisper API audio transcription.
 */
export const transcribeAudio = async (customerPhone, fileBuffer, mimeType, customerId = null) => {
  const startTime = Date.now();
  const client = getOpenAI();

  if (!client) {
    console.log("ℹ️ [AI Service] Running in Mock audio transcription mode.");
    // Return standard voice simulation
    return { text: "Hello, I am looking for a 2 BHK apartment under 30 lakhs. Do you have ready possession flats?" };
  }

  try {
    let extension = "ogg";
    if (mimeType.includes("mp3")) extension = "mp3";
    else if (mimeType.includes("wav")) extension = "wav";
    else if (mimeType.includes("m4a")) extension = "m4a";

    const file = new File([fileBuffer], `whatsapp_voice.${extension}`, { type: mimeType });

    const response = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    const latencyMs = Date.now() - startTime;
    const whisperCost = (latencyMs / 1000) * RATES["whisper-1"].ratePerSecond;

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "whisper",
      model: "whisper-1",
      cost: whisperCost,
      latencyMs,
      error: null
    });

    return { text: response.text };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error("❌ [AI Service] Whisper audio transcription failed:", err.message);

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "whisper",
      model: "whisper-1",
      error: err.message,
      latencyMs
    });

    return { text: "", error: err.message };
  }
};

/**
 * Image classification via Vision.
 */
export const analyzeImageContent = async (customerPhone, imageUrl, customerId = null) => {
  const startTime = Date.now();
  const client = getOpenAI();
  const model = "gpt-4o-mini";

  if (!client) {
    console.log("ℹ️ [AI Service] Running in Mock Vision analysis mode.");
    // Simulate detecting a floor plan if filename contains specific words
    let type = "other";
    let description = "A general photo sent by the user.";
    
    if (imageUrl.includes("floor") || imageUrl.includes("plan") || imageUrl.includes("blueprint")) {
      type = "floor_plan";
      description = "A floor plan showing a 2BHK flat layout with dimensions.";
    } else if (imageUrl.includes("map") || imageUrl.includes("location")) {
      type = "map";
      description = "A route map showing directions to the property site.";
    }

    return { type, description };
  }

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Analyze this image sent by a real estate client.
Determine if it is one of: "floor_plan", "map", "document", "site_photo", "other".
Return a JSON object containing:
- "type": string (one of: floor_plan, map, document, site_photo, other)
- "description": string (one-sentence description of the image content)

JSON format:
{
  "type": "floor_plan",
  "description": "A sketch showing room dimensions and layouts for a 3BHK flat."
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What is this image?" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.1
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const latencyMs = Date.now() - startTime;
    const rates = RATES[model];
    const cost = (usage.prompt_tokens * rates.input) + (usage.completion_tokens * rates.output);

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "vision",
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost,
      latencyMs,
      error: null
    });

    return parsed;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error("❌ [AI Service] Vision analysis failed:", err.message);

    await AiLog.create({
      customer: customerId,
      customerPhone,
      action: "vision",
      model,
      error: err.message,
      latencyMs
    });

    return { type: "unknown", description: "Failed to analyze image content: " + err.message };
  }
};
