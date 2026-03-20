import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export const classifyIntent = async (text, lang) => {
  if (!genAI) {
    console.warn("GEMINI_API_KEY missing. Returning fallback intent.");
    return { intent: "mandi_price", crop: "wheat", location: "unknown" };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an intent classification system for a farming voice assistant.
Classify the intent of the following farmer query: "${text}"

Possible intents:
- weather
- mandi_price
- crop_advice
- general

Extract the intent, the specific crop mentioned (if any), and the location mentioned (if any).
Return ONLY valid JSON like this, with no markdown formatting or backticks:
{
  "intent": "<intent>",
  "crop": "<crop_name_or_null>",
  "location": "<location_or_null>"
}
`;

  try {
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    
    // Clean up potential markdown blocks
    if (jsonStr.startsWith("\`\`\`json")) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (jsonStr.startsWith("\`\`\`")) {
      jsonStr = jsonStr.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return { intent: "general", crop: null, location: null };
  }
};
