import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from './logger.service.js';
dotenv.config();

// gemini-1.5-flash: 1500 free requests/day (vs gemini-2.5-flash's 20/day)
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  logger.warn('GEMINI_API_KEY is missing from environment variables.');
}

// ---------------------------------------------------------------------------
// Local keyword-based fallback classifier (runs without Gemini)
// ---------------------------------------------------------------------------
const CROPS = [
  'wheat', 'rice', 'paddy', 'corn', 'maize', 'sugarcane', 'cotton', 'soybean', 'soya',
  'mustard', 'groundnut', 'onion', 'potato', 'tomato', 'chilli', 'garlic', 'ginger',
  'bajra', 'jowar', 'ragi', 'arhar', 'tur', 'moong', 'urad', 'lentil', 'dal', 'gram', 'chana'
];
const WEATHER_KEYWORDS = ['weather', 'forecast', 'rain', 'temperature', 'temp', 'climate', 'mausam', 'barish', 'baarish', 'garmi', 'sardi'];
const MANDI_KEYWORDS = ['price', 'rate', 'mandi', 'market', 'bhav', 'daam', 'cost', 'selling', 'khareed'];
const ADVICE_KEYWORDS = ['advice', 'suggest', 'crop', 'sow', 'seed', 'fertilizer', 'pesticide', 'disease', 'salah', 'fasal', 'bimari'];

function localClassifyIntent(text) {
  const lower = text.toLowerCase();

  const foundCrop = CROPS.find(c => lower.includes(c)) || null;
  // naive location: look for capitalised word not in known lists
  const locationMatch = text.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  const location = locationMatch ? locationMatch[1] : null;

  if (WEATHER_KEYWORDS.some(k => lower.includes(k))) {
    return { intent: 'weather', crop: foundCrop, location };
  }
  if (MANDI_KEYWORDS.some(k => lower.includes(k)) || foundCrop) {
    return { intent: 'mandi_price', crop: foundCrop || 'general', location };
  }
  if (ADVICE_KEYWORDS.some(k => lower.includes(k))) {
    return { intent: 'crop_advice', crop: foundCrop, location };
  }
  return { intent: 'general', crop: foundCrop, location };
}

// ---------------------------------------------------------------------------
// Gemini helpers with retry
// ---------------------------------------------------------------------------
async function callGeminiWithRetry(model, prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      const is429 = err?.message?.includes('429');
      const isNetwork = err?.message?.includes('fetch failed') || err?.message?.includes('ECONNRESET');
      if ((is429 || isNetwork) && attempt < retries) {
        const delay = (attempt + 1) * 1500;
        logger.warn(`Gemini call failed (attempt ${attempt + 1}), retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const classifyIntent = async (text, lang) => {
  if (!genAI) {
    logger.warn('Gemini AI not initialized. Using local keyword fallback.');
    return localClassifyIntent(text);
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
    logger.debug(`Calling Gemini for intent classification: "${text}"`);
    let jsonStr = await callGeminiWithRetry(model, prompt);

    // Clean up potential markdown blocks
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(jsonStr);
    logger.debug('Gemini classification successful', parsed);
    return parsed;
  } catch (error) {
    const is429 = error?.message?.includes('429');
    logger.error(`Gemini intent classification failed${is429 ? ' (quota exceeded)' : ''}`, error);
    logger.info('Falling back to local keyword classifier.');
    return localClassifyIntent(text);
  }
};

export const analyzeText = async (prompt) => {
  if (!genAI) {
    logger.warn('Gemini AI not initialized. Using fallback text analysis.');
    return 'Could not perform analysis as Gemini API Key is missing.';
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  try {
    logger.debug('Calling Gemini for text analysis/extraction');
    return await callGeminiWithRetry(model, prompt);
  } catch (error) {
    logger.error('Gemini text analysis failed', error);
    return 'Analysis failed due to an error.';
  }
};
