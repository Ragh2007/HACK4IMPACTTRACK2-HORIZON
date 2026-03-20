import { getJson } from 'serpapi';
import { analyzeText } from './ai.service.js';
import dotenv from 'dotenv';
import { logger } from './logger.service.js';
dotenv.config();

// Static fallback prices (₹/Qtl) — typical MSP/mandi rates as of early 2025
const FALLBACK_PRICES = {
  wheat:      { price: 2275, trend: 'stable' },
  rice:       { price: 2183, trend: 'stable' },
  paddy:      { price: 2183, trend: 'stable' },
  corn:       { price: 1850, trend: 'rising' },
  maize:      { price: 1850, trend: 'rising' },
  sugarcane:  { price:  315, trend: 'stable', unit: '100kg' },
  cotton:     { price: 6620, trend: 'falling' },
  soybean:    { price: 4600, trend: 'stable' },
  mustard:    { price: 5650, trend: 'rising' },
  groundnut:  { price: 6377, trend: 'stable' },
  onion:      { price: 1200, trend: 'falling' },
  potato:     { price:  800, trend: 'stable' },
  tomato:     { price:  900, trend: 'rising' },
  chilli:     { price: 6000, trend: 'stable' },
  gram:       { price: 5440, trend: 'stable' },
  chana:      { price: 5440, trend: 'stable' },
  moong:      { price: 8558, trend: 'rising' },
  urad:       { price: 7400, trend: 'stable' },
  arhar:      { price: 7000, trend: 'stable' },
  tur:        { price: 7000, trend: 'stable' },
};

const DEFAULT_FALLBACK = { price: 2200, trend: 'stable', unit: 'Qtl' };

function getFallbackPrice(crop) {
  if (!crop) return DEFAULT_FALLBACK;
  const key = crop.toLowerCase().trim();
  return FALLBACK_PRICES[key] || DEFAULT_FALLBACK;
}

// SerpApi call wrapped with 1 retry on network errors
async function searchWithRetry(params) {
  try {
    return await getJson(params);
  } catch (err) {
    const isNetwork = err?.message?.includes('ECONNRESET') || err?.message?.includes('fetch failed') || err?.message?.includes('ETIMEDOUT');
    if (isNetwork) {
      logger.warn('SerpApi network error, retrying in 2s…');
      await new Promise(r => setTimeout(r, 2000));
      return await getJson(params); // second attempt — let it throw if it fails again
    }
    throw err;
  }
}

export const getMandiPrice = async (crop, location, coords) => {
  try {
    const query = `current mandi price and agriculture news for ${crop || 'crops'} in ${location || 'India'}`;
    logger.info(`Searching mandi prices: "${query}"`);
    
    // Search using SerpApi (with 1 retry on network error)
    const response = await searchWithRetry({
      engine: 'google',
      q: query,
      api_key: process.env.SERPAPI_KEY
    });

    const results = response.organic_results || [];
    logger.debug(`SerpApi returned ${results.length} snippets.`);
    
    if (results.length > 0) {
      logger.debug(`Top snippet preview: ${results[0].snippet?.substring(0, 100)}...`);
    }

    const textData = results.map(r => r.snippet).join('\n');
    
    const prompt = `
You are an agriculture market analyst. Based on the following organic search results about "${crop}" in "${location}":
${textData}

Extract the estimated price per quintal, the general trend (rising, stable, falling), and a short 1-sentence news summary.
If you cannot find exact data, provide a reasonable estimate based on the context or state "Data unavailable".
Return ONLY valid JSON like this, with no markdown formatting or backticks:
{
  "price": "<number or string>",
  "trend": "<rising/falling/stable/unknown>",
  "unit": "Qtl",
  "news_summary": "<summary>"
}
`;
    
    const analysisStr = await analyzeText(prompt);
    
    const fb = getFallbackPrice(crop);
    let parsed = { price: fb.price, trend: fb.trend, unit: fb.unit || 'Qtl', news_summary: 'No news available.' };
    try {
      let jsonStr = analysisStr;
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      logger.error('Failed to parse Gemini mandi analysis output', e);
    }

    return {
      crop: crop || 'General Crop',
      location: location || 'Local Mandi',
      price: parsed.price,
      unit: parsed.unit || 'Qtl',
      trend: parsed.trend || 'unknown',
      news_summary: parsed.news_summary || 'No recent news.'
    };
  } catch (error) {
    logger.error('Mandi service search failed', error);
    const fb = getFallbackPrice(crop);
    return {
      crop: crop || 'General Crop',
      location: location || 'Local Mandi',
      price: fb.price,
      unit: fb.unit || 'Qtl',
      trend: fb.trend,
      news_summary: 'Live price unavailable. Showing approximate MSP/mandi estimate.'
    };
  }
};
