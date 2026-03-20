import { getJson } from 'serpapi';
import { analyzeText } from './ai.service.js';
import dotenv from 'dotenv';
dotenv.config();

export const getMandiPrice = async (crop, location) => {
  try {
    const query = `current mandi price and agriculture news for ${crop || 'crops'} in ${location || 'India'}`;
    console.log(`[MandiService] Running SerpApi Google search: "${query}"`);
    
    // Search using SerpApi
    const response = await getJson({
      engine: "google",
      q: query,
      api_key: process.env.SERPAPI_KEY
    });

    const results = response.organic_results || [];
    console.log(`[MandiService] Found ${results.length} result snippets.`);
    
    if (results.length > 0) {
      console.log(`[MandiService] Top snippet: ${results[0].snippet?.substring(0, 100)}...`);
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
    
    let parsed = { price: 2000, trend: "unknown", unit: "Qtl", news_summary: "No news available." };
    try {
      let jsonStr = analysisStr;
      if (jsonStr.startsWith("\`\`\`json")) {
        jsonStr = jsonStr.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
      } else if (jsonStr.startsWith("\`\`\`")) {
        jsonStr = jsonStr.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini mandi analysis:", e);
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
    console.error("Mandi search failed:", error);
    return {
      crop: crop || 'General Crop',
      location: location || 'Local Mandi',
      price: 2200,
      unit: 'Qtl',
      trend: 'rising',
      news_summary: 'Unable to fetch latest news.'
    };
  }
};
