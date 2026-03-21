import { classifyIntent } from '../services/ai.service.js';
import { getMandiPrice } from '../services/mandi.service.js';
import { getWeatherForecast } from '../services/weather.service.js';
import { logQuery } from '../services/db.service.js';
import { logger } from '../services/logger.service.js';

export const analyzeIntent = async (req, res) => {
  try {
    const { text, lang, coords } = req.body;
    logger.info(`Analyzing intent for: "${text}"`, { lang, coords });
    
    if (!text) {
      logger.warn("Empty text query received");
      return res.status(400).json({ error: "Text is required" });
    }

    const aiResult = await classifyIntent(text, lang || 'en');
    const { intent, crop, location } = aiResult;
    logger.info(`Extracted parameters: intent=${intent}, crop=${crop}, location=${location}`);
    
    let responseText = "";

    if (intent === 'weather') {
      const weather = await getWeatherForecast(location, coords);
      if (lang === 'hi') {
        responseText = `${weather.location} में मौसम ${weather.condition} है। तापमान ${weather.temp} है। सुझाव: सिंचाई के लिए अच्छा समय है।`;
      } else {
        responseText = `The weather in ${weather.location} is ${weather.condition} with a temperature of ${weather.temp}. Advice: ${weather.advice}`;
      }
    } else if (intent === 'mandi_price') {
      const priceData = await getMandiPrice(crop, location, coords);
      if (lang === 'hi') {
        responseText = `${priceData.location} में ${priceData.crop} का भाव ₹${priceData.price} प्रति क्विंटल है। दाम ${priceData.trend} है। खबर: ${priceData.news_summary}`;
      } else {
        responseText = `The price of ${priceData.crop} in ${priceData.location} is ₹${priceData.price} per ${priceData.unit}. The trend is ${priceData.trend}. News: ${priceData.news_summary}`;
      }
    } else if (intent === 'crop_advice') {
      if (lang === 'hi') {
        responseText = "इस मौसम में खरीफ फसलों की बुवाई फायदेमंद रहेगी।";
      } else {
        responseText = "Sowing Kharif crops is recommended for this season.";
      }
    } else {
      if (lang === 'hi') {
        responseText = `मैंने समझा कि आप "${crop || 'कुछ'}" के बारे में पूछ रहे हैं, पर कृपया मौसम या मंडी भाव के बारे में पूछें।`;
      } else {
        responseText = `I understood you are asking about "${crop || 'something'}", but please ask about weather or mandi prices.`;
      }
    }

    logger.info(`Generated Response: "${responseText}"`);

    res.json({
      intent,
      crop,
      location,
      response: responseText
    });

    // Fire and forget asynchronous logging
    logQuery(text, intent, crop, location, lang || 'en', responseText);
    
  } catch (error) {
    logger.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze intent" });
  }
};
